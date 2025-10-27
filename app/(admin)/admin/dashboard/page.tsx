import { supabaseServer } from '@/lib/supabase-server'
import { ShoppingCart, IndianRupee, Users, Package } from 'lucide-react'
import StatCard from '@/components/admin/dashboard/StatCard'
import SilverRateCard from '@/components/admin/dashboard/SilverRateCard'
import TrendCard from '@/components/admin/dashboard/TrendCard'
import OrderPipeline from '@/components/admin/dashboard/OrderPipeline'
import TopResellers from '@/components/admin/dashboard/TopResellers'
import TopProducts from '@/components/admin/dashboard/TopProducts'
import PaymentsSummary from '@/components/admin/dashboard/PaymentsSummary'
import RewardsSummary from '@/components/admin/dashboard/RewardsSummary'
import type { DashboardMetrics, SilverRate, SilverRateTrend, OrderPipelineStatus, TopReseller, TopProduct, PaymentsSummary as PaymentsSummaryType, RewardItem } from '@/types/dashboard'

async function fetchDashboardData() {
  const supabase = await supabaseServer()

  try {
    const [
      metricsRes,
      silverRateRes,
      trendRes,
      pipelineRes,
      topResellersRes,
      topProductsRes,
      paymentsRes,
      rewardsRes,
    ] = await Promise.all([
      // Total orders, revenue, active resellers (exclude admin), products in stock
      Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_price').eq('status', 'delivered'),
        supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'approved').neq('profiles.role', 'admin'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]),
      // Current silver rate
      supabase.rpc('get_current_silver_rate'),
      // 7-day trend
      supabase.rpc('get_silver_rate_trend_7days').then(res => {
        if (res.error) {
          // Fallback query if RPC doesn't exist
          return supabase
            .from('silver_rates')
            .select('created_at, rate_per_gram')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true })
        }
        return res
      }),
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
      // Recent rewards
      supabase.from('rewards').select('reseller_id, amount, status, created_at').order('created_at', { ascending: false }).limit(2),
    ])

    // Process metrics
    const metrics: DashboardMetrics = {
      totalOrders: metricsRes[0].count || 0,
      totalRevenue: metricsRes[1].data?.reduce((sum, o) => sum + Number(o.total_price || 0), 0) || 0,
      activeResellers: metricsRes[2].count || 0,
      productsInStock: metricsRes[3].count || 0,
    }

    // Process silver rate
    const silverRate: SilverRate = {
      rate: Number(silverRateRes.data) || 0,
    }

    // Process trend
    const trends: SilverRateTrend[] = (trendRes.data || []).map((t: any) => ({
      day: t.d || t.created_at,
      rate: Number(t.rate || t.rate_per_gram || 0),
    }))

    // Process pipeline
    const pipelineData = pipelineRes.data || []
    const pipeline: OrderPipelineStatus = {
      pending: pipelineData.filter((o: any) => o.status === 'pending').length,
      processing: pipelineData.filter((o: any) => o.status === 'processing').length,
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

    // Process rewards
    const rewards: RewardItem[] = (rewardsRes.data || []).map((r: any) => ({
      reseller_id: r.reseller_id,
      amount: Number(r.amount || 0),
      status: r.status,
      created_at: r.created_at,
    }))

    return {
      metrics,
      silverRate,
      trends,
      pipeline,
      topResellers,
      topProducts,
      paymentsSummary,
      rewards,
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    throw error
  }
}

export default async function DashboardPage() {
  try {
    const data = await fetchDashboardData()

    return (
      <div className="space-y-6">
        {/* Header Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={data.metrics.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Total Revenue"
            value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.metrics.totalRevenue)}
            icon={IndianRupee}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
          />
          <StatCard
            title="Active Resellers"
            value={data.metrics.activeResellers.toLocaleString()}
            icon={Users}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
          <StatCard
            title="Products in Stock"
            value={data.metrics.productsInStock.toLocaleString()}
            icon={Package}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-100"
          />
        </div>

        {/* Silver Rate Card */}
        <SilverRateCard initialRate={data.silverRate.rate} />

        {/* Trend Card */}
        <TrendCard trends={data.trends} />

        {/* Order Pipeline */}
        <OrderPipeline pipeline={data.pipeline} />

        {/* Reseller Insights + Top Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopResellers resellers={data.topResellers} />
          <TopProducts products={data.topProducts} />
        </div>

        {/* Payments + Rewards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentsSummary summary={data.paymentsSummary} />
          <RewardsSummary rewards={data.rewards} />
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
