import { supabaseServer } from '@/lib/supabase-server'
import { ShoppingCart, Users, Package, UserPlus } from 'lucide-react'
import StatCard from '@/components/admin/dashboard/StatCard'
import SilverRateCard from '@/components/admin/dashboard/SilverRateCard'
import OrderPipeline from '@/components/admin/dashboard/OrderPipeline'
import TopResellers from '@/components/admin/dashboard/TopResellers'
import TopProducts from '@/components/admin/dashboard/TopProducts'
import PaymentsSummary from '@/components/admin/dashboard/PaymentsSummary'
import TargetStatus from '@/components/admin/dashboard/TargetStatus'
import NotificationBell from '@/components/admin/dashboard/NotificationBell'
import type { DashboardMetrics, SilverRate, OrderPipelineStatus, TopReseller, TopProduct, PaymentsSummary as PaymentsSummaryType, TargetSummary } from '@/types/dashboard'

async function fetchDashboardData() {
  const supabase = await supabaseServer()

  try {
    // Get first day of current month
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    
    const [
      metricsRes,
      silverRateRes,
      pipelineRes,
      topResellersRes,
      topProductsRes,
    ] = await Promise.all([
      // Total orders, revenue, active resellers (exclude admin), resellers added this month, products in stock
      Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_price').eq('status', 'delivered'),
        supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'approved').neq('profiles.role', 'admin'),
        supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'approved').neq('profiles.role', 'admin').gte('created_at', firstDayOfMonth),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]),
      // Current silver rate
      supabase.rpc('get_current_silver_rate'),
      // Order pipeline
      supabase.from('orders').select('status'),
      // Top resellers by revenue (exclude admin)
      supabase
        .from('resellers')
        .select(`
          id, 
          shop_name,
          orders(total_price, status)
        `)
        .eq('status', 'approved')
        .limit(10),
      // Top products by order frequency
      supabase
        .from('products')
        .select(`
          id,
          name,
          order_items(quantity, orders(status))
        `)
        .eq('status', 'active')
        .limit(10),
    ])

    // Process metrics
    const metrics: DashboardMetrics = {
      totalOrders: metricsRes[0].count || 0,
      totalRevenue: metricsRes[1].data?.reduce((sum, o) => sum + Number(o.total_price || 0), 0) || 0,
      activeResellers: metricsRes[2].count || 0,
      resellersAddedThisMonth: metricsRes[3].count || 0,
      productsInStock: metricsRes[4].count || 0,
    }

    // Process silver rate
    const silverRate: SilverRate = {
      rate: Number(silverRateRes.data) || 0,
    }

    // Process pipeline
    const pipelineData = pipelineRes.data || []
    const pipeline: OrderPipelineStatus = {
      pending: pipelineData.filter((o: any) => o.status === 'pending').length,
      accepted: pipelineData.filter((o: any) => o.status === 'accepted').length,
      making: pipelineData.filter((o: any) => o.status === 'in_making').length,
      shipped: pipelineData.filter((o: any) => o.status === 'dispatched').length,
      delivered: pipelineData.filter((o: any) => o.status === 'delivered').length,
      cancelled: pipelineData.filter((o: any) => o.status === 'cancelled' || o.status === 'rejected').length,
    }

    // Process top resellers (calculate from orders)
    let topResellers: TopReseller[] = []
    if (topResellersRes.data && Array.isArray(topResellersRes.data)) {
      const resellersWithStats = topResellersRes.data.map((r: any) => {
        const deliveredOrders = r.orders?.filter((o: any) => o.status === 'delivered') || []
        const revenue = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0)
        const ordersCount = deliveredOrders.length
        
        return {
          id: r.id,
          shop_name: r.shop_name,
          orders_count: ordersCount,
          revenue: revenue,
        }
      })
      
      // Sort by revenue and take top 3
      topResellers = resellersWithStats
        .filter(r => r.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
    }

    // Process top products (calculate from order items in delivered orders)
    // Get all delivered order IDs first
    const { data: deliveredOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'delivered')
    
    let topProducts: TopProduct[] = []
    
    if (deliveredOrders && deliveredOrders.length > 0) {
      const orderIds = deliveredOrders.map(o => o.id)
      
      // Get order items for these orders (using weight_kg instead of quantity)
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, product_name, weight_kg, item_total')
        .in('order_id', orderIds)
      
      
      if (items && items.length > 0) {
        // Group by product and sum weight_kg (units)
        const productStats = new Map<string, { 
          id: string
          name: string
          weight: number  // Total weight in kg
          lines: number   // Number of order lines
          revenue: number // Total revenue
        }>()
        
        items.forEach((item: any) => {
          if (item.product_id) {
            const existing = productStats.get(item.product_id)
            const weight = Number(item.weight_kg || 0)
            const revenue = Number(item.item_total || 0)
            
            if (existing) {
              existing.weight += weight
              existing.lines += 1
              existing.revenue += revenue
            } else {
              productStats.set(item.product_id, {
                id: item.product_id,
                name: item.product_name || 'Unknown Product',
                weight: weight,
                lines: 1,
                revenue: revenue,
              })
            }
          }
        })
        
        // Sort by weight (most weight sold = top product) and take top 3
        topProducts = Array.from(productStats.values())
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            name: p.name,
            lines_count: p.lines,
            units: Math.round(p.weight * 100) / 100, // Round weight to 2 decimals
          }))
      }
    }

    // Process payments (from v_reseller_outstanding view to match payment section)
    const { data: outstandingData } = await supabase.from('v_reseller_outstanding').select('*')
    
    const paymentsSummary: PaymentsSummaryType = {
      received: outstandingData?.reduce((sum: number, r: any) => sum + Number(r.received || 0), 0) || 0,
      pending: outstandingData?.reduce((sum: number, r: any) => {
        const outstanding = Number(r.outstanding || 0)
        return outstanding > 0 ? sum + outstanding : sum
      }, 0) || 0,
      overdue: 0, // We don't track overdue separately in current implementation
    }

    // Fetch actual target data
    const { data: activeTargets } = await supabase
      .from('targets')
      .select('id, reseller_id, goal, type, created_at, deadline, resellers(shop_name)')
      .eq('status', 'active')
      .order('deadline', { ascending: true })
      .limit(10)

    // Calculate progress for each active target
    const targetsWithProgress = await Promise.all(
      (activeTargets || []).map(async (t: any) => {
        let currentProgress = 0
        
        if (t.reseller_id) {
          const { data: deliveredOrders } = await supabase
            .from('orders')
            .select('id, total_weight_kg, total_price')
            .eq('reseller_id', t.reseller_id)
            .eq('status', 'delivered')
            .gte('created_at', t.created_at)
            .lte('created_at', t.deadline)
          
          if (deliveredOrders && deliveredOrders.length > 0) {
            const { data: outstandingData } = await supabase
              .from('v_reseller_outstanding')
              .select('outstanding')
              .eq('reseller_id', t.reseller_id)
              .maybeSingle()
            
            const resellerOutstanding = Number(outstandingData?.outstanding || 0)
            
            if (resellerOutstanding <= 0) {
              if (t.type === 'weight') {
                currentProgress = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total_weight_kg || 0), 0)
              } else if (t.type === 'purchase_value' || t.type === 'revenue') {
                currentProgress = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0)
              } else if (t.type === 'order_count') {
                currentProgress = deliveredOrders.length
              }
            }
          }
        }
        
        const percentage = t.goal > 0 ? Math.min(100, Math.round((currentProgress / t.goal) * 100)) : 0
        
        return {
          targetId: t.id,  // Add unique target ID
          resellerId: t.reseller_id,
          resellerName: t.resellers?.shop_name || 'Unknown',
          targetAmount: t.goal,
          achievedAmount: currentProgress,
          percentage,
        }
      })
    )

    // Calculate overall percentage (average of all active targets)
    const overallPercentage = targetsWithProgress.length > 0
      ? Math.round(targetsWithProgress.reduce((sum, t) => sum + t.percentage, 0) / targetsWithProgress.length)
      : 0

    const targetSummary: TargetSummary = {
      overallPercentage,
      topPerformers: targetsWithProgress.slice(0, 2),
    }

    return {
      metrics,
      silverRate,
      pipeline,
      topResellers,
      topProducts,
      paymentsSummary,
      targetSummary,
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    throw error
  }
}

export default async function DashboardPage() {
  try {
    const data = await fetchDashboardData()

    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    return (
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{currentDate}</p>
          </div>
          <NotificationBell />
        </div>

        {/* Header Stats Grid with Silver Rate */}
        <div className="flex flex-wrap items-center gap-4">
          <StatCard
            title="Total Orders"
            value={data.metrics.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Active Resellers"
            value={data.metrics.activeResellers.toLocaleString()}
            icon={Users}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
          <StatCard
            title="Resellers Added (Month)"
            value={data.metrics.resellersAddedThisMonth.toLocaleString()}
            icon={UserPlus}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
          />
          <StatCard
            title="Products in Stock"
            value={data.metrics.productsInStock.toLocaleString()}
            icon={Package}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-100"
          />
          <div className="ml-auto">
            <SilverRateCard initialRate={data.silverRate.rate} />
          </div>
        </div>

        {/* Order Pipeline - Prominent Section */}
        <OrderPipeline pipeline={data.pipeline} />

        {/* Reseller Insights + Top Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopResellers resellers={data.topResellers} />
          <TopProducts products={data.topProducts} />
        </div>

        {/* Payments + Target Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentsSummary summary={data.paymentsSummary} />
          <TargetStatus summary={data.targetSummary} />
        </div>
      </div>
    )
  } catch (error: any) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Failed to load dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error?.message || 'Unknown error occurred'}</p>
        </div>
      </div>
    )
  }
}
