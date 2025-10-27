import { supabaseServer } from '@/lib/supabase-server'
import { OrderFilters, OrderStats, OrderWithReseller } from '@/types/orders'
import OrdersTable from '@/components/admin/orders/OrdersTable'
import OrdersStats from '@/components/admin/orders/OrdersStats'
import OrdersFilters from '@/components/admin/orders/OrdersFilters'

async function fetchOrdersData(
  filters: OrderFilters,
  page: number = 1,
  limit: number = 20
): Promise<{
  orders: OrderWithReseller[]
  total: number
  stats: OrderStats
}> {
  const supabase = await supabaseServer()
  const offset = (page - 1) * limit

  try {
    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        resellers!inner(shop_name)
      `, { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    if (filters.resellerId) {
      query = query.eq('reseller_id', filters.resellerId)
    }
    if (filters.search) {
      // Search in order_code or reseller name
      query = query.or(`order_code.ilike.%${filters.search}%,resellers.shop_name.ilike.%${filters.search}%`)
    }

    // Execute query with pagination
    const { data: ordersData, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Transform data
    const orders: OrderWithReseller[] = (ordersData || []).map((o: any) => ({
      ...o,
      reseller_name: o.resellers?.shop_name || 'Unknown',
      order_code: o.order_code || `SL${new Date(o.created_at).getFullYear()}-${o.id.slice(0, 4).toUpperCase()}`,
    }))

    // Fetch stats
    const [newOrdersRes, pendingRes, dispatchedRes, pipelineData] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'dispatched'),
      supabase
        .from('orders')
        .select('status'),
    ])

    // Calculate pipeline breakdown
    const statusCounts = (pipelineData.data || []).reduce((acc: any, order: any) => {
      const status = order.status
      if (status === 'pending') acc.pending++
      else if (status === 'accepted' || status === 'in_making') acc.processing++
      else if (status === 'dispatched') acc.shipped++
      else if (status === 'delivered') acc.delivered++
      else if (status === 'cancelled' || status === 'rejected') acc.cancelled++
      return acc
    }, { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 })

    const stats: OrderStats = {
      new_orders: newOrdersRes.count || 0,
      pending: pendingRes.count || 0,
      dispatched: dispatchedRes.count || 0,
      pipeline: statusCounts,
    }

    return {
      orders,
      total: count || 0,
      stats,
    }
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return {
      orders: [],
      total: 0,
      stats: { 
        new_orders: 0, 
        pending: 0, 
        dispatched: 0, 
        pipeline: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 }
      },
    }
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  
  const filters: OrderFilters = {
    status: sp.status as any,
    dateFrom: sp.dateFrom as string,
    dateTo: sp.dateTo as string,
    resellerId: sp.resellerId as string,
    search: sp.search as string,
  }

  const page = Number(sp.page) || 1
  const { orders, total, stats } = await fetchOrdersData(filters, page)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Orders</h1>
          <p className="text-sm text-slate-600">Order Management</p>
        </div>
      </div>

      <OrdersFilters />
      <OrdersStats stats={stats} />
      <OrdersTable orders={orders} total={total} currentPage={page} />
    </div>
  )
}
