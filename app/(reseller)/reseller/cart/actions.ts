"use server"

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import type { AddToCartInput, CartItem as DBCartItem, CartSummary, WeightRangeInput } from '@/types/cart'
import { pricePreview } from '@/app/(reseller)/reseller/products/actions'

type CheckoutItem = {
  productId?: string
  product?: { id?: string } | null
  weightKg?: number
  total?: number
  preTaxTotal?: number              // ✅ taxable_amount from pricePreview
  gstAmount?: number
  silverRate?: number
  gstRate?: number
  productName?: string
  productImage?: string
  hsnCode?: string
  deductionPct?: number
  laborPerKg?: number
  offerDiscount?: number
  segments?: Array<{ label: string; weightKg: number }>
}

type CheckoutPayload = {
  shipping: {
    full_name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  items: CheckoutItem[]
}

export async function placeOrder(payload: CheckoutPayload) {
  const sb = await supabaseServer()

  // 1) Auth
  const { data: { user }, error: userErr } = await sb.auth.getUser()
  if (userErr || !user) throw new Error('AUTH_REQUIRED')

  // 2) Ensure reseller id (RPC must exist; uses RLS definer)
  const { data: resellerId, error: ridErr } = await sb.rpc('ensure_reseller_for_user', { uid: user.id })
  if (ridErr || !resellerId) {
    throw new Error(`RESELLER_RESOLVE_FAILED: ${ridErr?.message ?? 'unknown error'}`)
  }

  // 3) Get current rates for snapshot
  const { data: silverRateData } = await sb
    .from('silver_rates')
    .select('rate_per_gram')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  const { data: gstSetting } = await sb
    .from('settings')
    .select('value')
    .eq('key', 'gst_rate')
    .maybeSingle()

  const currentSilverRate = silverRateData?.rate_per_gram ?? 0
  const currentGstRate = parseFloat(gstSetting?.value ?? '3')

  // 4) Normalize & validate items with full snapshot
  const items = (payload.items ?? []).map((i, idx) => {
    const product_id = i.productId ?? i.product?.id ?? null
    if (!product_id) throw new Error(`PRODUCT_ID_MISSING at item ${idx + 1}`)

    const weight_kg = Number(i.weightKg ?? 0)
    if (!isFinite(weight_kg) || weight_kg <= 0) {
      throw new Error(`INVALID_WEIGHT at item ${idx + 1}`)
    }

    // Use pre-tax total (taxable amount) for line item price
    const price_pretax = Number(i.preTaxTotal ?? i.total ?? 0)
    if (!isFinite(price_pretax) || price_pretax < 0) {
      throw new Error(`INVALID_TOTAL at item ${idx + 1}`)
    }

    return {
      product_id,
      weight_kg,
      price_pretax,
      meta: {
        product_name: i.productName ?? 'Unknown Product',
        product_image: i.productImage ?? null,
        hsn_code: i.hsnCode ?? '',
        weight_kg,
        rate_per_gm: Number(i.silverRate ?? currentSilverRate),
        deduction_pct: Number(i.deductionPct ?? 0),
        labor_per_kg: Number(i.laborPerKg ?? 0),
        offer_applied: Number(i.offerDiscount ?? 0),
        segments: i.segments ?? [],
      },
    }
  })

  if (items.length === 0) throw new Error('EMPTY_CART')

  // 5) Server totals (authoritative)
  const totals = items.reduce(
    (a, it) => ({ weight: a.weight + it.weight_kg, amount: a.amount + it.price_pretax }),
    { weight: 0, amount: 0 }
  )
  
  // Calculate GST on total
  const totalGst = totals.amount * (currentGstRate / 100)
  const grandTotal = totals.amount + totalGst

  // Generate order code
  let orderCode = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  try {
    const { data: code } = await sb.rpc('generate_order_code')
    if (code) orderCode = code as string
  } catch {}

  // 6) Insert order with correct schema columns
  const { data: order, error: oErr } = await sb
    .from('orders')
    .insert({
      reseller_id: resellerId,
      order_code: orderCode,
      status: 'pending',
      payment_status: 'unpaid',
      total_weight_kg: totals.weight,
      subtotal: totals.amount,
      discount_amount: 0,
      global_loop_amount: 0,
      taxable_amount: totals.amount,
      gst_amount: totalGst,
      total_price: grandTotal,
      notes: `Shipping: ${payload.shipping.full_name}, ${payload.shipping.address}, ${payload.shipping.city}, ${payload.shipping.state} - ${payload.shipping.pincode} | Phone: ${payload.shipping.phone}`,
    })
    .select('id')
    .single()

  if (oErr) throw new Error(`ORDER_CREATE_FAILED: ${oErr.message}`)

  // 7) Insert items (bulk) with correct schema
  const rows = items.map((it) => {
    const itemGst = it.price_pretax * (currentGstRate / 100)
    const itemTotal = it.price_pretax + itemGst
    const basePrice = it.weight_kg * 1000 * it.meta.rate_per_gm
    const deduction = basePrice * (it.meta.deduction_pct / 100)
    const labor = it.weight_kg * it.meta.labor_per_kg
    
    return {
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.meta.product_name,
      product_image: it.meta.product_image,
      weight_kg: it.weight_kg,
      weight_ranges: it.meta.segments || null,
      silver_rate: it.meta.rate_per_gm,
      base_price: basePrice,
      deduction_amount: deduction,
      labor_charges: labor,
      discount_amount: it.meta.offer_applied || 0,
      global_loop_amount: 0,
      gst_rate: currentGstRate,
      gst_amount: itemGst,
      item_total: itemTotal,
    }
  })

  const { error: oiErr } = await sb.from('order_items').insert(rows)
  if (oiErr) throw new Error(`ORDER_ITEMS_FAILED: ${oiErr.message}`)

  return { orderId: order.id }
}

// ============ DB-backed Cart ============

function normalizeRanges(ranges?: WeightRangeInput[] | null): any[] | null {
  if (!ranges || !Array.isArray(ranges)) return null
  return ranges.map(r => ({ range: r.range, weight_kg: Number(r.weight_kg || 0) }))
}

export type ActionResult<T = any> = { ok: true; data?: T } | { ok: false; error: string }

export async function addToCart(input: AddToCartInput): Promise<ActionResult> {
  try {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    // Validate product active
    const { data: prod, error: pErr } = await sb
      .from('products')
      .select('id, status')
      .eq('id', input.productId)
      .maybeSingle()
    if (pErr || !prod) return { ok: false, error: 'Product not found' }
    if (prod.status !== 'active') return { ok: false, error: 'Product is not active' }

    const ranges = normalizeRanges(input.ranges)
    const weightKg = Number(input.weightKg || (ranges?.reduce((s, r) => s + (r.weight_kg || 0), 0) ?? 0))
    if (!isFinite(weightKg) || weightKg <= 0) return { ok: false, error: 'Invalid weight' }

    // Compute price snapshot
    const snapshot = ranges && ranges.length > 0
      ? await pricePreview({ productId: input.productId, segments: ranges as any })
      : await pricePreview({ productId: input.productId, total_weight_kg: weightKg } as any)

    const { error } = await sb
      .from('cart_items')
      .upsert({
        user_id: user.id,
        product_id: input.productId,
        weight_kg: weightKg,
        weight_ranges: ranges,
        price_snapshot: snapshot,
      }, { onConflict: 'user_id,product_id' })

    if (error) throw error
    revalidatePath('/reseller/cart')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to add to cart' }
  }
}

export async function getCart(): Promise<DBCartItem[]> {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return []

  const { data } = await sb
    .from('cart_items')
    .select('id, product_id, weight_kg, weight_ranges, price_snapshot, created_at, updated_at, products:product_id(name, images)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []).map((row: any) => ({
    id: row.id,
    product_id: row.product_id,
    product_name: row.products?.name ?? 'Product',
    product_image: Array.isArray(row.products?.images) ? row.products.images[0] ?? null : null,
    weight_kg: Number(row.weight_kg ?? 0),
    weight_ranges: row.weight_ranges ?? null,
    price_snapshot: row.price_snapshot,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

export async function updateCartItem(cartItemId: string, weight_kg: number): Promise<ActionResult> {
  try {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }
    if (!isFinite(weight_kg) || weight_kg <= 0) return { ok: false, error: 'Invalid weight' }

    const { data: existing } = await sb
      .from('cart_items')
      .select('id, product_id')
      .eq('id', cartItemId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!existing) return { ok: false, error: 'Cart item not found' }

    const snapshot = await pricePreview({ productId: existing.product_id, total_weight_kg: weight_kg } as any)

    const { error } = await sb
      .from('cart_items')
      .update({ weight_kg, weight_ranges: null, price_snapshot: snapshot })
      .eq('id', cartItemId)
      .eq('user_id', user.id)

    if (error) throw error
    revalidatePath('/reseller/cart')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to update cart item' }
  }
}

export async function removeFromCart(cartItemId: string): Promise<ActionResult> {
  try {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const { error } = await sb
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', user.id)

    if (error) throw error
    revalidatePath('/reseller/cart')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to remove cart item' }
  }
}

export async function clearCart(): Promise<ActionResult> {
  try {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const { error } = await sb
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
    revalidatePath('/reseller/cart')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to clear cart' }
  }
}

export async function getCartSummary(): Promise<CartSummary> {
  const items = await getCart()
  const summary = items.reduce((acc, it) => {
    const snap = it.price_snapshot || {}
    const subtotal = Number(snap.subtotal ?? 0)
    const discount = Number((snap.reseller_discount_amount ?? 0) + (snap.offer_discount ?? 0))
    const globalLoop = Number(snap.global_loop_amount ?? 0)
    const taxable = Number(snap.taxable_amount ?? 0)
    const gst = Number(snap.gst_amount ?? 0)
    const total = Number(snap.total_price ?? 0)
    acc.itemCount += 1
    acc.totalWeightKg += Number(it.weight_kg || 0)
    acc.subtotal += subtotal
    acc.discount += discount
    acc.globalLoop += globalLoop
    acc.taxable += taxable
    acc.gst += gst
    acc.total += total
    return acc
  }, {
    itemCount: 0,
    totalWeightKg: 0,
    subtotal: 0,
    discount: 0,
    globalLoop: 0,
    taxable: 0,
    gst: 0,
    total: 0,
  } as CartSummary)

  return summary
}
