'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { OrderListItem, OrderDetail, OrderItemDetail, InvoiceData, PriceBreakdown, OrderStatus } from '@/types/reseller'
import { getResellerProfile } from '../actions'
import type { PaymentStatus } from '@/types/order'

// Helper function to get or create reseller ID (RLS-compliant)
async function getOrCreateResellerId(userId: string): Promise<string> {
  const supabase = await supabaseServer()
  
  // 1) Find profile + role
  const { data: me, error: meErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (meErr) {
    console.error('Error fetching profile:', meErr)
    throw new Error(`Profile lookup failed: ${meErr.message}`)
  }
  
  if (!me) {
    console.error('No profile found for userId:', userId)
    throw new Error('Profile not found')
  }
  
  if (me.role !== 'reseller') {
    console.error('User role mismatch:', { userId, role: me.role })
    throw new Error(`Not a reseller. Current role: ${me.role}`)
  }

  // 2) Find reseller row
  const { data: r } = await supabase
    .from('resellers')
    .select('id')
    .eq('user_id', me.id)
    .maybeSingle()

  let resellerId = r?.id

  if (!resellerId) {
    // Insert (allowed by RLS policy)
    const { data: created, error: upErr } = await supabase
      .from('resellers')
      .insert({ user_id: me.id }) // Only required columns; others can be NULL
      .select('id')
      .single()

    if (upErr) {
      throw new Error(`Failed to create reseller record: ${upErr.message}`)
    }
    resellerId = created.id
  }

  return resellerId
}

async function getKpis(sb: any, resellerId: string) {
  // Quick counts by status for tabs
  const { data } = await sb
    .from('orders')
    .select('status', { count: 'exact', head: false })
    .eq('reseller_id', resellerId)
  
  const counts = { all: 0, pending: 0, dispatched: 0, delivered: 0, cancelled: 0 }
  for (const r of data ?? []) {
    counts.all++
    if (r.status in counts) counts[r.status as keyof typeof counts]++
  }
  return counts
}

export async function getMyOrders(params?: {
  status?: OrderStatus
  search?: string
  page?: number
  perPage?: number
}) {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('AUTH_REQUIRED')

  // Get reseller id
  const { data: res } = await sb.from('resellers').select('id').eq('user_id', user.id).maybeSingle()
  if (!res?.id) throw new Error('RESELLER_NOT_FOUND')

  const page = params?.page ?? 1
  const pageSize = params?.perPage ?? 20

  let q = sb
    .from('orders')
    .select(`
      id, created_at, status, payment_status,
      total_price,
      total_weight_kg,
      order_code,
      order_items ( id )
    `)
    .eq('reseller_id', res.id)
    .order('created_at', { ascending: false })

  if (params?.status) q = q.eq('status', params.status)
  if (params?.search) q = q.ilike('order_code', `%${params.search}%`)

  const { data: rows, error } = await q.range((page-1)*pageSize, page*pageSize-1)
  if (error) throw error

  // Map to UI DTO expected by components
  const list = (rows ?? []).map(o => ({
    id: o.id,
    created_at: o.created_at,
    status: o.status as OrderStatus,
    order_number: (o as any).order_code ?? o.id.slice(0,6).toUpperCase(),
    item_count: ((o as any).order_items ?? []).length,
    total_weight: Number((o as any).total_weight_kg ?? 0),
    total_amount: Number((o as any).total_price ?? 0),
  }))

  return { 
    items: list, 
    total: list.length, 
    kpis: await getKpis(sb, res.id) 
  }
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('AUTH_REQUIRED')

  const { data: res } = await sb.from('resellers').select('id').eq('user_id', user.id).maybeSingle()
  if (!res?.id) throw new Error('RESELLER_NOT_FOUND')

  const { data: o, error } = await sb
    .from('orders')
    .select(`
      id, created_at, updated_at, status, payment_status, order_code,
      total_price, total_weight_kg, subtotal, discount_amount, global_loop_amount,
      taxable_amount, gst_amount, notes,
      order_items ( 
        id, product_id, product_name, product_image, weight_kg, 
        silver_rate, base_price, deduction_amount, labor_charges,
        discount_amount, global_loop_amount, gst_rate, gst_amount, item_total
      )
    `)
    .eq('id', orderId)
    .eq('reseller_id', res.id)
    .single()
  
  if (error) throw error

  return {
    id: o.id,
    created_at: o.created_at,
    status: o.status as OrderStatus,
    order_number: (o as any).order_code ?? o.id.slice(0,6).toUpperCase(),
    total_amount: Number((o as any).total_price ?? 0),
    total_weight: Number((o as any).total_weight_kg ?? 0),
    shipping_address: '', // Parse from notes if needed
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
    shipping_phone: '',
    tracking_number: null,
    delivery_partner: null,
    notes: o.notes,
    items: ((o as any).order_items ?? []).map((it: any) => ({
      id: it.id,
      product_id: it.product_id,
      product_name: it.product_name ?? 'Item',
      product_image: it.product_image ?? null,
      weight_kg: Number(it.weight_kg ?? 0),
      quantity: 1,
      unit_price: Number(it.item_total ?? 0),
      line_total: Number(it.item_total ?? 0),
      tunch_percentage: null,
      labor_per_kg: Number(it.labor_charges ?? 0),
    })),
  }
}

export async function computePrice(params: {
  productId: string
  weightKg: number
}): Promise<PriceBreakdown> {
  const supabase = await supabaseServer()

  // Get product details
  const { data: product } = await supabase
    .from('products')
    .select('tunch_percentage, labor_per_kg, offer_enabled, offer_type, offer_value')
    .eq('id', params.productId)
    .single()

  if (!product) {
    throw new Error('Product not found')
  }

  // Get current silver rate
  const { data: latestRate } = await supabase
    .from('silver_rates')
    .select('rate_per_gram')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const silverRate = latestRate?.rate_per_gram ?? 0

  // Get settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['extra_charges', 'gst_rate'])

  const extraCharges = parseFloat(settings?.find(s => s.key === 'extra_charges')?.value ?? '0')
  const gstRate = parseFloat(settings?.find(s => s.key === 'gst_rate')?.value ?? '0')

  // Calculate pricing (same formula as admin)
  const weightKg = params.weightKg
  const base = weightKg * 1000 * silverRate
  const tunchPct = product.tunch_percentage ?? 0
  const deductionPct = 100 - (tunchPct + extraCharges)
  const deduction = base * (deductionPct / 100)
  const labor = (product.labor_per_kg ?? 0) * weightKg
  const subtotal = base - deduction + labor

  // Calculate offer discount
  let offerDiscount = 0
  if (product.offer_enabled) {
    if (product.offer_type === 'percentage') {
      offerDiscount = subtotal * ((product.offer_value ?? 0) / 100)
    } else if (product.offer_type === 'flat') {
      offerDiscount = product.offer_value ?? 0
    }
  }

  const taxable = subtotal - offerDiscount
  const gst = taxable * (gstRate / 100)
  const total = taxable + gst

  return {
    weight_kg: weightKg,
    silver_rate: silverRate,
    base_price: base,
    deduction_pct: deductionPct,
    deduction_amount: deduction,
    labor_charges: labor,
    subtotal,
    offer_discount: offerDiscount,
    taxable_amount: taxable,
    gst_rate: gstRate,
    gst_amount: gst,
    total_price: total,
  }
}

// ============ Additional Order Actions ============

export async function createOrder(notes?: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Resolve reseller id
    const { data: resellerId, error: ridErr } = await sb.rpc('ensure_reseller_for_user', { uid: user.id })
    if (ridErr || !resellerId) return { success: false, error: 'Failed to resolve reseller' }

    // Load cart items
    const { data: rows } = await sb
      .from('cart_items')
      .select('id, product_id, weight_kg, weight_ranges, price_snapshot')
      .eq('user_id', user.id)
    if (!rows || rows.length === 0) return { success: false, error: 'Cart is empty' }

    // Preload product names/images
    const productIds = Array.from(new Set(rows.map(r => r.product_id)))
    const { data: prods } = await sb
      .from('products')
      .select('id, name, images')
      .in('id', productIds)
    const prodMap = new Map<string, any>((prods ?? []).map(p => [p.id, p]))

    // Aggregate totals
    const agg = rows.reduce((a: any, r: any) => {
      const snap = r.price_snapshot || {}
      a.weight += Number(r.weight_kg || 0)
      a.subtotal += Number(snap.subtotal ?? 0)
      a.discount += Number((snap.reseller_discount_amount ?? 0) + (snap.offer_discount ?? 0))
      a.globalLoop += Number(snap.global_loop_amount ?? 0)
      a.taxable += Number(snap.taxable_amount ?? 0)
      a.gst += Number(snap.gst_amount ?? 0)
      a.total += Number(snap.total_price ?? 0)
      return a
    }, { weight: 0, subtotal: 0, discount: 0, globalLoop: 0, taxable: 0, gst: 0, total: 0 })

    // Order code via RPC (fallback if missing)
    let orderCode = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0')
    try {
      const { data: code } = await sb.rpc('generate_order_code')
      if (code) orderCode = code as string
    } catch {}

    // Insert order
    const { data: order, error: oErr } = await sb
      .from('orders')
      .insert({
        reseller_id: resellerId,
        order_code: orderCode,
        status: 'pending',
        payment_status: 'unpaid',
        total_weight_kg: agg.weight,
        subtotal: agg.subtotal,
        discount_amount: agg.discount,
        global_loop_amount: agg.globalLoop,
        taxable_amount: agg.taxable,
        gst_amount: agg.gst,
        total_price: agg.total,
        notes: notes || null,
      })
      .select('id')
      .single()
    if (oErr) return { success: false, error: oErr.message }

    // Insert order items
    const items = rows.map((r: any) => {
      const snap = r.price_snapshot || {}
      const p = prodMap.get(r.product_id)
      const firstImage = Array.isArray(p?.images) ? p.images[0] ?? null : null
      return {
        order_id: order!.id,
        product_id: r.product_id,
        product_name: p?.name ?? 'Product',
        product_image: firstImage,
        weight_kg: Number(r.weight_kg || 0),
        weight_ranges: r.weight_ranges ?? null,
        silver_rate: Number(snap.silver_rate ?? snap.rate_per_gram ?? 0),
        base_price: Number(snap.base_price ?? 0),
        deduction_amount: Number(snap.deduction_amount ?? 0),
        labor_charges: Number(snap.labor_charges ?? 0),
        discount_amount: Number((snap.reseller_discount_amount ?? 0) + (snap.offer_discount ?? 0)),
        global_loop_amount: Number(snap.global_loop_amount ?? 0),
        gst_rate: Number(snap.gst_rate ?? 0),
        gst_amount: Number(snap.gst_amount ?? 0),
        item_total: Number(snap.total_price ?? 0),
      }
    })

    const { error: oiErr } = await sb.from('order_items').insert(items)
    if (oiErr) return { success: false, error: oiErr.message }

    // Clear cart and revalidate
    await sb.from('cart_items').delete().eq('user_id', user.id)

    return { success: true, orderId: order!.id }
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to create order' }
  }
}

export async function getOrders(params?: { status?: OrderStatus; search?: string; page?: number; perPage?: number }): Promise<any[]> {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return []

  const { data: res } = await sb.from('resellers').select('id').eq('user_id', user.id).maybeSingle()
  if (!res?.id) return []

  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let q = sb
    .from('orders')
    .select('*')
    .eq('reseller_id', res.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.status) q = q.eq('status', params.status)
  if (params?.search) q = q.ilike('order_code', `%${params.search}%`)

  const { data } = await q
  return data ?? []
}

export async function cancelOrder(orderId: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    // Ensure order belongs to reseller and is pending; RLS also enforces
    const { error } = await sb
      .from('orders')
      .update({ status: 'cancelled', cancelled_reason: reason || null, cancelled_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) throw error
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || 'Failed to cancel order' }
  }
}

export async function placeOrder(params: {
  items: { productId: string; weightKg: number; quantity: number }[]
  shippingOverride?: {
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
}): Promise<string> {
  const supabase = await supabaseServer()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Get or create reseller ID first
  const resellerId = await getOrCreateResellerId(user.id)
  
  // Now get full reseller details
  const { data: reseller } = await supabase
    .from('resellers')
    .select('id, shop_name, address, city, state, pincode, phone')
    .eq('id', resellerId)
    .single()

  // Validate all items
  const productIds = params.items.map(i => i.productId)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, status, images, tunch_percentage, labor_per_kg, offer_enabled, offer_type, offer_value')
    .in('id', productIds)

  // Check for inactive products
  const inactiveProducts = products?.filter(p => p.status !== 'active') ?? []
  if (inactiveProducts.length > 0) {
    throw new Error(`Some products are no longer available: ${inactiveProducts.map(p => p.name).join(', ')}`)
  }

  // Compute pricing for each item
  let totalAmount = 0
  let totalWeight = 0
  const orderItems = []

  for (const item of params.items) {
    if (item.weightKg <= 0 || item.quantity <= 0) {
      throw new Error('Invalid weight or quantity')
    }

    const breakdown = await computePrice({
      productId: item.productId,
      weightKg: item.weightKg,
    })

    const product = products?.find(p => p.id === item.productId)
    if (!product) continue

    const unitPrice = breakdown.total_price
    const lineTotal = unitPrice * item.quantity

    orderItems.push({
      product_id: item.productId,
      product_name: product.name,
      product_image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
      weight_kg: item.weightKg * item.quantity,
      weight_ranges: null,
      silver_rate: breakdown.silver_rate,
      base_price: breakdown.base_price * item.quantity,
      deduction_amount: breakdown.deduction_amount * item.quantity,
      labor_charges: breakdown.labor_charges * item.quantity,
      discount_amount: (breakdown.reseller_discount_amount ?? 0) * item.quantity,
      global_loop_amount: (breakdown.global_loop_amount ?? 0) * item.quantity,
      gst_rate: breakdown.gst_rate,
      gst_amount: breakdown.gst_amount * item.quantity,
      item_total: unitPrice * item.quantity,
    })

    totalAmount += lineTotal
    totalWeight += item.weightKg * item.quantity
  }

  // Generate order code using RPC or fallback
  let orderCode = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  try {
    const { data: code } = await supabase.rpc('generate_order_code')
    if (code) orderCode = code as string
  } catch {}

  // Use shipping override or default from reseller
  const shipping = params.shippingOverride ?? {
    address: reseller.address ?? '',
    city: reseller.city ?? '',
    state: reseller.state ?? '',
    pincode: reseller.pincode ?? '',
    phone: reseller.phone ?? '',
  }

  // Calculate aggregated pricing from order items
  const subtotal = orderItems.reduce((sum, item) => sum + (item.base_price - item.deduction_amount + item.labor_charges), 0)
  const discountAmount = orderItems.reduce((sum, item) => sum + item.discount_amount, 0)
  const globalLoopAmount = orderItems.reduce((sum, item) => sum + item.global_loop_amount, 0)
  const taxableAmount = subtotal - discountAmount + globalLoopAmount
  const gstAmount = orderItems.reduce((sum, item) => sum + item.gst_amount, 0)
  const totalPrice = taxableAmount + gstAmount

  // Create order with correct schema columns
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      reseller_id: reseller.id,
      order_code: orderCode,
      status: 'pending',
      payment_status: 'unpaid',
      total_weight_kg: totalWeight,
      subtotal: subtotal,
      discount_amount: discountAmount,
      global_loop_amount: globalLoopAmount,
      taxable_amount: taxableAmount,
      gst_amount: gstAmount,
      total_price: totalPrice,
      notes: `Shipping: ${shipping.address}, ${shipping.city}, ${shipping.state} - ${shipping.pincode} | Phone: ${shipping.phone}`,
    })
    .select('id')
    .single()

  if (error || !order) {
    throw new Error('Failed to create order')
  }

  // Create order items
  const itemsToInsert = orderItems.map(item => ({
    ...item,
    order_id: order.id,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Rollback order
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error('Failed to create order items')
  }

  return order.id
}

export async function getInvoiceData(orderId: string): Promise<InvoiceData> {
  const supabase = await supabaseServer()
  
  // Get order detail
  const order = await getOrderDetail(orderId)
  
  const profile = await getResellerProfile()
  
  // Get reseller info
  const { data: reseller } = await supabase
    .from('resellers')
    .select('shop_name, address, city, state, pincode, phone')
    .eq('user_id', profile.id)
    .single()

  // Get company/settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['company_name', 'company_address', 'company_gstin', 'company_phone', 'company_email', 'gst_rate'])

  const getSetting = (key: string, defaultValue = '') => {
    return settings?.find(s => s.key === key)?.value ?? defaultValue
  }

  const gstRate = parseFloat(getSetting('gst_rate', '0'))
  const subtotal = order.items.reduce((sum, item) => sum + item.line_total, 0)
  const gstAmount = subtotal * (gstRate / 100)
  const total = subtotal + gstAmount

  return {
    order,
    reseller: {
      name: reseller?.shop_name ?? 'Reseller',
      address: reseller?.address ?? '',
      city: reseller?.city ?? '',
      state: reseller?.state ?? '',
      pincode: reseller?.pincode ?? '',
      phone: reseller?.phone ?? '',
      email: '', // Not stored in resellers table
    },
    company: {
      name: getSetting('company_name', 'SilverLine B2B'),
      address: getSetting('company_address', ''),
      gstin: getSetting('company_gstin', ''),
      phone: getSetting('company_phone', ''),
      email: getSetting('company_email', ''),
    },
    breakdown: {
      subtotal,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total,
    },
  }
}
