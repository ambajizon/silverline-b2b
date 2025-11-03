'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { ReportFilters, SalesKPIs, SalesTrendPoint, CategorySales, SalesTransaction, TopProduct, OverduePayment, MonthlySummary } from '@/types/reports'

type ActionResult<T = any> =
  | { ok: true; data: T }
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

function getDateRangeFromFilter(dateRange: string, dateFrom?: string, dateTo?: string) {
  const now = new Date()
  let from: Date
  let to: Date = now

  if (dateRange === 'custom' && dateFrom && dateTo) {
    from = new Date(dateFrom)
    to = new Date(dateTo)
  } else {
    switch (dateRange) {
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

export async function getSalesKPIs(filters: ReportFilters): Promise<ActionResult<SalesKPIs>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { from, to } = getDateRangeFromFilter(filters.date_range, filters.date_from, filters.date_to)

    // Direct query instead of RPC
    let query = supabase
      .from('orders')
      .select('total_price, total_weight_kg')
      .eq('status', 'delivered')
      .gte('created_at', from)
      .lte('created_at', to)

    if (filters.reseller_id) query = query.eq('reseller_id', filters.reseller_id)

    const { data: orders, error } = await query

    if (error) throw error

    const totalRevenue = orders?.reduce((sum, o) => sum + o.total_price, 0) || 0
    const totalOrders = orders?.length || 0
    const totalQuantityKg = orders?.reduce((sum, o) => sum + o.total_weight_kg, 0) || 0

    return {
      ok: true,
      data: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        total_quantity_kg: totalQuantityKg,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch sales KPIs' }
  }
}

export async function getSalesTrend(filters: ReportFilters): Promise<ActionResult<SalesTrendPoint[]>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { from, to } = getDateRangeFromFilter(filters.date_range, filters.date_from, filters.date_to)

    // Direct query instead of RPC
    let query = supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('status', 'delivered')
      .gte('created_at', from)
      .lte('created_at', to)

    if (filters.reseller_id) query = query.eq('reseller_id', filters.reseller_id)

    const { data: orders, error } = await query

    if (error) throw error

    const trendMap = new Map<string, { revenue: number; orders: number }>()
    orders?.forEach((order) => {
      const date = order.created_at.split('T')[0]
      const existing = trendMap.get(date) || { revenue: 0, orders: 0 }
      trendMap.set(date, {
        revenue: existing.revenue + order.total_price,
        orders: existing.orders + 1,
      })
    })

    const trend = Array.from(trendMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { ok: true, data: trend }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch sales trend' }
  }
}

export async function getSalesByCategory(filters: ReportFilters): Promise<ActionResult<CategorySales[]>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { from, to } = getDateRangeFromFilter(filters.date_range, filters.date_from, filters.date_to)

    // Direct query to order_items
    let query = supabase
      .from('order_items')
      .select(`
        product_name,
        item_total,
        weight_kg,
        orders!inner(created_at, status, reseller_id)
      `)
      .eq('orders.status', 'delivered')
      .gte('orders.created_at', from)
      .lte('orders.created_at', to)

    if (filters.reseller_id) query = query.eq('orders.reseller_id', filters.reseller_id)

    const { data: items, error } = await query

    if (error) throw error

    // Group by category (using "Jewelry" as default since all are jewelry products)
    const categoryName = 'Jewelry'
    const revenue = items?.reduce((sum, item) => sum + Number(item.item_total || 0), 0) || 0
    const units = items?.length || 0

    return {
      ok: true,
      data: [{
        category_name: categoryName,
        revenue,
        units,
        orders: items?.length || 0,
      }],
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch sales by category' }
  }
}

export async function getSalesTransactions(
  filters: ReportFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<ActionResult<{ data: SalesTransaction[]; total: number }>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { from, to } = getDateRangeFromFilter(filters.date_range, filters.date_from, filters.date_to)

    // Direct query instead of RPC
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_code,
        created_at,
        total_price,
        reseller_id,
        resellers(shop_name)
      `, { count: 'exact' })
      .eq('status', 'delivered')
      .gte('created_at', from)
      .lte('created_at', to)

    if (filters.reseller_id) query = query.eq('reseller_id', filters.reseller_id)
    if (filters.search) {
      query = query.or(`order_code.ilike.%${filters.search}%,resellers.shop_name.ilike.%${filters.search}%`)
    }

    const { data: orders, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const transactions: SalesTransaction[] = (orders || []).map((order: any) => ({
      order_id: order.id,
      order_number: order.order_code,
      date: order.created_at,
      reseller_name: order.resellers?.shop_name || 'Unknown',
      total_amount: order.total_price,
      product_count: 1, // Simplified
      payment_status: 'paid' as any, // Simplified for now
    }))

    return { ok: true, data: { data: transactions, total: count || 0 } }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch sales transactions' }
  }
}

export async function getTopProducts(filters: ReportFilters): Promise<ActionResult<TopProduct[]>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { from, to } = getDateRangeFromFilter(filters.date_range, filters.date_from, filters.date_to)

    // Direct query instead of RPC
    const { data: items, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        weight_kg,
        item_total,
        orders!inner(created_at, status)
      `)
      .eq('orders.status', 'delivered')
      .gte('orders.created_at', from)
      .lte('orders.created_at', to)

    if (error) throw error

    const productMap = new Map<string, { name: string; category: string; units: number; revenue: number }>()

    items?.forEach((item: any) => {
      const existing = productMap.get(item.product_id) || {
        name: item.product_name || 'Unknown',
        category: 'Jewelry',
        units: 0,
        revenue: 0,
      }
      productMap.set(item.product_id, {
        ...existing,
        units: existing.units + 1,
        revenue: existing.revenue + Number(item.item_total || 0),
      })
    })

    const topProducts = Array.from(productMap.entries())
      .map(([id, stats]) => ({
        product_id: id,
        product_name: stats.name,
        category_name: stats.category,
        units_sold: stats.units,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return { ok: true, data: topProducts }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch top products' }
  }
}

export async function getOverduePayments(filters: ReportFilters): Promise<ActionResult<OverduePayment>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { from, to } = getDateRangeFromFilter(filters.date_range, filters.date_from, filters.date_to)

    // Use v_reseller_outstanding view for outstanding balances
    const { data: outstanding, error } = await supabase
      .from('v_reseller_outstanding')
      .select('outstanding')

    if (error) throw error

    // Count resellers with overdue and sum
    let count = 0
    let totalAmount = 0

    outstanding?.forEach((row: any) => {
      const amount = Number(row.outstanding || 0)
      if (amount > 0) {
        count++
        totalAmount += amount
      }
    })

    return { ok: true, data: { count, total_amount: totalAmount } }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch overdue payments' }
  }
}

export async function getMonthlySummary(filters: ReportFilters): Promise<ActionResult<MonthlySummary>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { from, to } = getDateRangeFromFilter(filters.date_range, filters.date_from, filters.date_to)

    // Current period
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('total_price')
      .gte('created_at', from)
      .lte('created_at', to)

    const totalRevenue = currentOrders?.reduce((sum, o) => sum + o.total_price, 0) || 0
    const totalOrders = currentOrders?.length || 0

    // Previous period for growth calculation
    const daysInRange = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
    const prevFrom = new Date(new Date(from).getTime() - daysInRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const prevTo = from

    const { data: prevOrders } = await supabase
      .from('orders')
      .select('total_price')
      .gte('created_at', prevFrom)
      .lt('created_at', prevTo)

    const prevRevenue = prevOrders?.reduce((sum, o) => sum + o.total_price, 0) || 0
    const growthPercent = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return {
      ok: true,
      data: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        growth_percent: growthPercent,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch monthly summary' }
  }
}

export async function exportSalesCsv(filters: ReportFilters): Promise<ActionResult<string>> {
  try {
    const { authorized } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const result = await getSalesTransactions(filters, 1, 10000)
    if (!result.ok) return result

    const transactions = result.data.data

    // Generate CSV
    const headers = ['Order Number', 'Date', 'Reseller', 'Total Amount', 'Product Count', 'Payment Status']
    const rows = transactions.map((t) => [
      t.order_number,
      new Date(t.date).toLocaleDateString(),
      t.reseller_name,
      t.total_amount.toFixed(2),
      t.product_count.toString(),
      t.payment_status,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    return { ok: true, data: csv }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to export CSV' }
  }
}
