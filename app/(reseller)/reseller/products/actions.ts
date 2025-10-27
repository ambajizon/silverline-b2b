'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { ProductListItem, Product, Category, SubCategory, PriceBreakdown } from '@/types/reseller'
import { calculateGSTBreakdown } from '@/lib/gst-utils'

export async function getCatalog(params?: {
  q?: string
  category_id?: string
  sub_category_id?: string
  page?: number
  perPage?: number
}) {
  const supabase = await supabaseServer()
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 20
  const offset = (page - 1) * perPage

  // Build query
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      images,
      status,
      category_id,
      categories(name)
    `, { count: 'exact' })
    .eq('status', 'active')

  // Apply filters
  if (params?.q) {
    query = query.or(`name.ilike.%${params.q}%,hsn_code.ilike.%${params.q}%`)
  }
  if (params?.category_id) {
    query = query.eq('category_id', params.category_id)
  }
  if (params?.sub_category_id) {
    query = query.eq('subcategory_id', params.sub_category_id)
  }

  // Pagination
  query = query.range(offset, offset + perPage - 1).order('name', { ascending: true })

  const { data: products, count } = await query

  // Fetch categories and subcategories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  const { data: subCategories } = await supabase
    .from('subcategories')
    .select('id, name, category_id')
    .order('name')

  // Transform products
  const items: ProductListItem[] = (products ?? []).map(p => ({
    id: p.id,
    name: p.name,
    category_name: (p.categories as any)?.name ?? null,
    image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
    status: p.status,
  }))

  return {
    items,
    total: count ?? 0,
    categories: (categories ?? []) as Category[],
    subCategories: (subCategories ?? []) as SubCategory[],
  }
}

export async function getProduct(productId: string): Promise<Product | null> {
  const supabase = await supabaseServer()

  const { data: product } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      category_id,
      subcategory_id,
      tunch_percentage,
      labor_per_kg,
      weight_ranges,
      images,
      hsn_code,
      status,
      offer_enabled,
      offer_type,
      offer_value,
      offer_text,
      categories(name),
      subcategories(name)
    `)
    .eq('id', productId)
    .single()

  if (!product) return null

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category_id: product.category_id,
    sub_category_id: product.subcategory_id,
    category_name: (product.categories as any)?.name ?? null,
    sub_category_name: (product.subcategories as any)?.name ?? null,
    tunch_percentage: product.tunch_percentage ?? 0,
    labor_per_kg: product.labor_per_kg ?? 0,
    weight_ranges: product.weight_ranges ?? [],
    images: product.images ?? [],
    hsn_code: product.hsn_code,
    status: product.status,
    offer_enabled: product.offer_enabled ?? false,
    offer_type: product.offer_type,
    offer_value: product.offer_value,
    offer_text: product.offer_text,
  }
}

export async function getCurrentSilverRate(): Promise<{ rate_per_gram: number; updated_at: string }> {
  const supabase = await supabaseServer()

  const { data: latest } = await supabase
    .from('silver_rates')
    .select('rate_per_gram, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    rate_per_gram: latest?.rate_per_gram ?? 0,
    updated_at: latest?.created_at ?? new Date().toISOString(),
  }
}

type PricePreviewInput =
  | { productId: string; total_weight_kg: number; silverRateOverride?: number }
  | { productId: string; segments: { range: { min: number; max: number }, weight_kg: number }[]; silverRateOverride?: number }

function resolveTotalWeightKg(input: PricePreviewInput): number {
  if ('total_weight_kg' in input) {
    return Math.max(0, input.total_weight_kg || 0)
  }
  return Math.max(
    0,
    (input.segments ?? []).reduce((s, seg) => s + (Number(seg.weight_kg) || 0), 0)
  )
}

export async function pricePreview(params: PricePreviewInput): Promise<PriceBreakdown> {
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

  // Get silver rate
  let silverRate = params.silverRateOverride
  if (!silverRate) {
    const { rate_per_gram } = await getCurrentSilverRate()
    silverRate = rate_per_gram
  }

  // Get settings including state codes
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['extra_charges', 'gst_rate', 'company_state_code'])

  console.log('🔍 Settings fetched:', settings)
  
  const extraCharges = parseFloat(settings?.find(s => s.key === 'extra_charges')?.value ?? '0')
  const gstRate = parseFloat(settings?.find(s => s.key === 'gst_rate')?.value ?? '0')
  const companyStateCode = settings?.find(s => s.key === 'company_state_code')?.value || null
  
  console.log('💰 GST Rate from DB:', gstRate)

  // Get current user's reseller details (state code, discount, global loop)
  const { data: { user } } = await supabase.auth.getUser()
  let resellerStateCode: string | null = null
  let resellerDiscount = 0
  let globalLoop = 0
  
  if (user) {
    const { data: reseller } = await supabase
      .from('resellers')
      .select('state_code, discount_percent, extra_charges_percent')
      .eq('user_id', user.id)
      .maybeSingle()
    
    resellerStateCode = reseller?.state_code || null
    resellerDiscount = parseFloat(reseller?.discount_percent?.toString() ?? '0')
    globalLoop = parseFloat(reseller?.extra_charges_percent?.toString() ?? '0')
  }

  // Calculate pricing using total weight
  const totalWeightKg = resolveTotalWeightKg(params)
  const base = totalWeightKg * 1000 * silverRate
  const tunchPct = product.tunch_percentage ?? 0
  const deductionPct = 100 - (tunchPct + extraCharges)
  const deduction = base * (deductionPct / 100)
  const labor = (product.labor_per_kg ?? 0) * totalWeightKg
  const subtotal = base - deduction + labor

  // Apply reseller-specific discount (reduce price)
  const resellerDiscountAmount = resellerDiscount > 0 ? subtotal * (resellerDiscount / 100) : 0
  
  // Apply global loop (add to price)
  const globalLoopAmount = globalLoop > 0 ? subtotal * (globalLoop / 100) : 0
  
  // Calculate price after reseller discount and global loop
  const priceAfterResellerTerms = subtotal - resellerDiscountAmount + globalLoopAmount

  // Calculate offer discount (product-level)
  let offerDiscount = 0
  if (product.offer_enabled) {
    if (product.offer_type === 'percentage') {
      offerDiscount = priceAfterResellerTerms * ((product.offer_value ?? 0) / 100)
    } else if (product.offer_type === 'flat') {
      offerDiscount = product.offer_value ?? 0
    }
  }

  const taxable = priceAfterResellerTerms - offerDiscount
  
  // Calculate GST breakdown (CGST/SGST/IGST)
  const gstBreakdown = calculateGSTBreakdown(taxable, gstRate, companyStateCode, resellerStateCode)
  
  const total = taxable + gstBreakdown.total_gst_amount

  return {
    weight_kg: totalWeightKg,
    silver_rate: silverRate,
    base_price: base,
    deduction_pct: deductionPct,
    deduction_amount: deduction,
    labor_charges: labor,
    subtotal,
    // Reseller discount and global loop
    reseller_discount_pct: resellerDiscount,
    reseller_discount_amount: resellerDiscountAmount,
    global_loop_pct: globalLoop,
    global_loop_amount: globalLoopAmount,
    offer_discount: offerDiscount,
    taxable_amount: taxable,
    gst_rate: gstRate,
    gst_amount: gstBreakdown.total_gst_amount,
    total_price: total,
    // GST Breakdown
    is_gst_enabled: gstBreakdown.is_gst_enabled,
    is_same_state: gstBreakdown.is_same_state,
    cgst_rate: gstBreakdown.cgst_rate,
    sgst_rate: gstBreakdown.sgst_rate,
    igst_rate: gstBreakdown.igst_rate,
    cgst_amount: gstBreakdown.cgst_amount,
    sgst_amount: gstBreakdown.sgst_amount,
    igst_amount: gstBreakdown.igst_amount,
    company_state_code: companyStateCode,
    reseller_state_code: resellerStateCode,
  }
}
