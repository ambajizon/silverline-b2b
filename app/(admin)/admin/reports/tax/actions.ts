'use server'

import { supabaseServer } from '@/lib/supabase-server'

type ActionResult =
  | { ok: true; data?: any }
  | { ok: false; error: string }

async function verifyAdmin() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') return { authorized: false, supabase }
  return { authorized: true, supabase }
}

export async function getTaxReport(filters: {
  date_from: string
  date_to: string
  include_gst: boolean
  reseller_id?: string
}): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Get all delivered orders in date range
    // Add time to make date comparison work with timestamps
    const dateFrom = `${filters.date_from}T00:00:00`
    const dateTo = `${filters.date_to}T23:59:59`
    
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_code,
        created_at,
        total_price,
        subtotal,
        gst_amount,
        taxable_amount,
        total_weight_kg,
        reseller_id,
        resellers(shop_name, phone)
      `)
      .eq('status', 'delivered')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    if (filters.reseller_id) {
      query = query.eq('reseller_id', filters.reseller_id)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    // Calculate summary
    const totalOrders = orders?.length || 0
    const totalSales = orders?.reduce((sum, o) => sum + Number(o.total_price || 0), 0) || 0
    const totalGST = orders?.reduce((sum, o) => sum + Number(o.gst_amount || 0), 0) || 0
    const totalTaxable = orders?.reduce((sum, o) => sum + Number(o.taxable_amount || 0), 0) || 0
    const totalWeight = orders?.reduce((sum, o) => sum + Number(o.total_weight_kg || 0), 0) || 0

    return {
      ok: true,
      data: {
        totalOrders,
        totalSales,
        totalGST,
        totalTaxable,
        totalWeight,
        period: {
          from: filters.date_from,
          to: filters.date_to,
        },
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to generate tax report' }
  }
}

export async function getInvoiceDetails(filters: {
  date_from: string
  date_to: string
  include_gst: boolean
  reseller_id?: string
}): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Get all delivered orders with full details
    const dateFrom = `${filters.date_from}T00:00:00`
    const dateTo = `${filters.date_to}T23:59:59`
    
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_code,
        created_at,
        total_price,
        subtotal,
        discount_amount,
        taxable_amount,
        gst_amount,
        total_weight_kg,
        reseller_id,
        resellers(shop_name, phone, contact_name),
        order_items(
          product_name,
          weight_kg,
          base_price,
          labor_charges,
          item_total,
          gst_rate,
          gst_amount
        )
      `)
      .eq('status', 'delivered')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    if (filters.reseller_id) {
      query = query.eq('reseller_id', filters.reseller_id)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    return {
      ok: true,
      data: orders || [],
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch invoice details' }
  }
}

export async function getPaymentDetails(filters: {
  date_from: string
  date_to: string
  reseller_id?: string
}): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Get all payments in date range
    const dateFrom = `${filters.date_from}T00:00:00`
    const dateTo = `${filters.date_to}T23:59:59`
    
    let query = supabase
      .from('payments')
      .select(`
        id,
        kind,
        amount,
        payment_date,
        payment_method,
        transaction_id,
        note,
        created_at,
        reseller_id,
        resellers(shop_name, phone)
      `)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    if (filters.reseller_id) {
      query = query.eq('reseller_id', filters.reseller_id)
    }

    const { data: payments, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    return {
      ok: true,
      data: payments || [],
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch payment details' }
  }
}
