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
      paymentsRes,
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
      // Top resellers (exclude admin)
      supabase.rpc('get_top_resellers').then(res => {
        if (res.error) {
          // Fallback manual query (exclude admin)
          return supabase
            .from('resellers')
            .select('id, shop_name, user_id, profiles!inner(role)')
            .eq('status', 'approved')
            .neq('profiles.role', 'admin')
            .limit(3)
        }
        return res
      }),
      // Top products
      supabase.rpc('get_top_products').then(res => {
        if (res.error) {
          // Fallback manual query
          return supabase
            .from('products')
            .select('id, name')
            .eq('status', 'active')
            .limit(3)
        }
        return res
      }),
      // Payments summary
      supabase.from('payments').select('status, amount'),
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
      making: pipelineData.filter((o: any) => o.status === 'making' || o.status === 'processing').length,
      shipped: pipelineData.filter((o: any) => o.status === 'shipped' || o.status === 'dispatched').length,
      delivered: pipelineData.filter((o: any) => o.status === 'delivered').length,
      cancelled: pipelineData.filter((o: any) => o.status === 'cancelled').length,
    }

    // Process top resellers (with fallback calculation)
    let topResellers: TopReseller[] = []
    if (topResellersRes.data && Array.isArray(topResellersRes.data) && topResellersRes.data.length > 0) {
      topResellers = topResellersRes.data.map((r: any) => ({
        id: r.id,
        shop_name: r.shop_name,
        orders_count: Number(r.orders_count || 0),
        revenue: Number(r.revenue || 0),
      }))
    }

    // Process top products
    let topProducts: TopProduct[] = []
    if (topProductsRes.data && Array.isArray(topProductsRes.data) && topProductsRes.data.length > 0) {
      topProducts = topProductsRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        lines_count: Number(p.lines_count || 0),
        units: Number(p.units || 0),
      }))
    }

    // Process payments
    const paymentsData = paymentsRes.data || []
    const paymentsSummary: PaymentsSummaryType = {
      received: paymentsData.filter((p: any) => p.status === 'received').reduce((sum, p) => sum + Number(p.amount || 0), 0),
      pending: paymentsData.filter((p: any) => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount || 0), 0),
      overdue: paymentsData.filter((p: any) => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount || 0), 0),
    }

    // Mock target data (TODO: Replace with actual targets query)
    const targetSummary: TargetSummary = {
      overallPercentage: 50,
      topPerformers: topResellers.slice(0, 2).map((r, idx) => ({
        resellerId: r.id,
        resellerName: r.shop_name,
        targetAmount: 100000,
        achievedAmount: 50000,
        percentage: 50,
      })),
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
