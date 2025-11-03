'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { RecordPaymentInput, PaymentFilters } from '@/types/payments'

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
  return { authorized: true, supabase, userId: user.id }
}

export async function getPaymentsDashboardStats(
  dateFrom?: string,
  dateTo?: string,
  resellerId?: string
): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Query v_reseller_outstanding view
    let query = supabase
      .from('v_reseller_outstanding')
      .select('*')

    if (resellerId) query = query.eq('reseller_id', resellerId)

    const { data: outstanding, error } = await query

    if (error) throw error

    // Calculate summary stats
    const totalReceived = outstanding?.reduce((sum, r) => sum + (Number(r.received) || 0), 0) || 0
    const totalOutstanding = outstanding?.reduce((sum, r) => sum + (Number(r.outstanding) || 0), 0) || 0
    const totalInvoiced = outstanding?.reduce((sum, r) => sum + (Number(r.invoiced) || 0), 0) || 0

    return {
      ok: true,
      data: {
        total_received: totalReceived,
        total_outstanding: totalOutstanding,
        total_invoiced: totalInvoiced,
        payment_breakdown: {
          paid: totalReceived,
          unpaid_overdue: totalOutstanding,
          partial: 0,
        },
      }
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch stats' }
  }
}

async function getStatsDirect(supabase: any, dateFrom?: string, dateTo?: string, resellerId?: string) {
  // Get all orders with their payments
  let query = supabase
    .from('orders')
    .select(`
      id,
      total_price,
      created_at,
      reseller_id,
      payments(amount, status, payment_date)
    `)

  if (resellerId) query = query.eq('reseller_id', resellerId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)

  const { data: orders } = await query

  // Calculate stats
  let totalOutstanding = 0
  let paidThisMonth = 0
  let overdue = 0
  let aging90Plus = 0
  let paid = 0
  let unpaidOverdue = 0
  let partial = 0

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  orders?.forEach((order: any) => {
    const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    const outstanding = order.total_price - totalPaid
    
    totalOutstanding += outstanding

    // Paid this month
    order.payments?.forEach((p: any) => {
      if (p.payment_date && new Date(p.payment_date) >= thisMonthStart) {
        paidThisMonth += p.amount
      }
    })

    // Aging
    const agingDays = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))
    if (outstanding > 0 && agingDays > 30) {
      overdue += outstanding
      if (agingDays > 90) {
        aging90Plus += outstanding
      }
    }

    // Breakdown
    if (outstanding === 0) {
      paid += order.total_price
    } else if (totalPaid > 0) {
      partial += order.total_price
    } else {
      unpaidOverdue += order.total_price
    }
  })

  return {
    ok: true,
    data: {
      total_outstanding: totalOutstanding,
      paid_this_month: paidThisMonth,
      overdue,
      aging_90_plus: aging90Plus,
      payment_breakdown: {
        paid,
        unpaid_overdue: unpaidOverdue,
        partial,
      },
    },
  }
}

export async function getPaymentsTable(filters: PaymentFilters): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Query v_reseller_outstanding view
    let query = supabase
      .from('v_reseller_outstanding')
      .select('*', { count: 'exact' })

    if (filters.reseller_id) query = query.eq('reseller_id', filters.reseller_id)
    if (filters.search) query = query.ilike('shop_name', `%${filters.search}%`)

    // Apply status filter
    if (filters.status === 'overdue' || filters.status === 'pending') {
      query = query.gt('outstanding', 0)
    } else if (filters.status === 'paid') {
      query = query.eq('outstanding', 0)
    }

    // Sort by outstanding desc
    query = query.order('outstanding', { ascending: false })

    const { data: resellers, count, error } = await query

    if (error) throw error

    // Transform to payment rows
    const payments = (resellers || []).map((r: any) => ({
      reseller_id: r.reseller_id,
      reseller_name: r.shop_name,
      invoiced: Number(r.invoiced || 0),
      received: Number(r.received || 0),
      outstanding: Number(r.outstanding || 0),
      status: Number(r.outstanding) === 0 ? 'paid' : Number(r.outstanding) > 0 ? 'pending' : 'overdue',
    }))

    return {
      ok: true,
      data: {
        payments,
        total: count || 0,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch payments' }
  }
}

async function getPaymentsTableDirect(supabase: any, filters: PaymentFilters) {
  const page = filters.page || 1
  const pageSize = 20
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_price,
      created_at,
      reseller_id,
      resellers(shop_name),
      payments(amount, status, payment_date)
    `, { count: 'exact' })

  if (filters.reseller_id) query = query.eq('reseller_id', filters.reseller_id)
  if (filters.date_from) query = query.gte('created_at', filters.date_from)
  if (filters.date_to) query = query.lte('created_at', filters.date_to)
  if (filters.search) {
    query = query.or(`order_number.ilike.%${filters.search}%,resellers.shop_name.ilike.%${filters.search}%`)
  }

  const { data: orders, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  const now = new Date()

  // Transform orders into payment rows
  const payments = (orders || []).map((order: any) => {
    const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    const amountDue = order.total_price - totalPaid
    const agingDays = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))
    
    let status: 'paid' | 'pending' | 'overdue' | 'partial' = 'pending'
    if (amountDue === 0) {
      status = 'paid'
    } else if (totalPaid > 0) {
      status = 'partial'
    } else if (agingDays > 30) {
      status = 'overdue'
    }

    return {
      id: order.id,
      order_id: order.id,
      order_number: order.order_number,
      reseller_name: order.resellers?.shop_name || 'Unknown',
      reseller_id: order.reseller_id,
      invoice_date: order.created_at,
      amount_due: amountDue,
      status,
      aging_days: agingDays,
    }
  })

  // Apply status filter
  let filteredPayments = payments
  if (filters.status) {
    filteredPayments = payments.filter((p: any) => p.status === filters.status)
  }

  // Apply aging bucket filter
  if (filters.aging_bucket && filters.aging_bucket !== 'all') {
    filteredPayments = filteredPayments.filter((p: any) => {
      const days = p.aging_days
      switch (filters.aging_bucket) {
        case '<=30':
          return days <= 30
        case '31-60':
          return days > 30 && days <= 60
        case '61-90':
          return days > 60 && days <= 90
        case '>90':
          return days > 90
        default:
          return true
      }
    })
  }

  return {
    ok: true,
    data: {
      payments: filteredPayments,
      total: count || 0,
    },
  }
}

export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Validate amount
    if (!input.amount || input.amount <= 0) {
      return { ok: false, error: 'Amount must be greater than 0' }
    }

    // Validate reseller exists
    const { data: reseller } = await supabase
      .from('resellers')
      .select('id')
      .eq('id', input.reseller_id)
      .single()

    if (!reseller) {
      return { ok: false, error: 'Reseller not found' }
    }

    // Insert payment with kind='payment'
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        reseller_id: input.reseller_id,
        kind: 'payment',
        amount: Number(input.amount),
        payment_method: input.payment_method || null,
        transaction_id: input.transaction_id || null,
        note: input.note || null,
      })

    if (insertError) throw insertError

    revalidatePath('/admin/payments')
    revalidatePath('/admin/dashboard')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to record payment' }
  }
}

export async function getResellersForFilter(): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Exclude admin resellers from filter dropdown
    const { data: resellers } = await supabase
      .from('resellers')
      .select('id, shop_name, profiles!inner(role)')
      .eq('status', 'approved')
      .neq('profiles.role', 'admin')
      .order('shop_name')

    return { ok: true, data: resellers || [] }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch resellers' }
  }
}
