import { getResellerProfile, getLiveRate, getRateTrend7d, getActiveTarget, getRecentOrders } from '../actions'
import DashboardHeader from '@/components/reseller/DashboardHeader'
import LiveRateCard from '@/components/reseller/LiveRateCard'
import RateTrendMini from '@/components/reseller/RateTrendMini'
import ActiveTargetsCard from '@/components/reseller/ActiveTargetsCard'
import RecentOrdersCard from '@/components/reseller/RecentOrdersCard'
import QuickLinksGrid from '@/components/reseller/QuickLinksGrid'

export default async function ResellerDashboardPage() {
  // Fetch all data in parallel
  const [profile, liveRate, rateTrend, activeTarget, recentOrders] = await Promise.all([
    getResellerProfile(),
    getLiveRate(),
    getRateTrend7d(),
    getActiveTarget('temp'), // Will be replaced with actual reseller ID
    getRecentOrders('temp', 5),
  ])

  // Get actual reseller ID and refetch orders/target if needed
  const [target, orders] = await Promise.all([
    getActiveTarget(profile.id),
    getRecentOrders(profile.id, 5),
  ])

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-20 pt-3 space-y-3">
      {/* Welcome Header */}
      <DashboardHeader 
        name={profile.first_name || 'Reseller'} 
        humanCode={profile.human_code || profile.id.slice(0, 8).toUpperCase()}
        logoUrl={profile.logo_url}
        shopName={profile.shop_name || undefined}
      />
      
      {/* Live Silver Rate with Realtime */}
      <LiveRateCard 
        rate={liveRate.rate_per_gram} 
        updatedAt={liveRate.updated_at} 
        changePct={liveRate.change_24h_pct} 
      />
      
      {/* 7-Day Trend Sparkline */}
      {rateTrend.length > 0 && (
        <RateTrendMini points={rateTrend} />
      )}
      
      {/* Active Target */}
      <ActiveTargetsCard target={target} />
      
      {/* Recent Orders */}
      <RecentOrdersCard orders={orders} />
      
      {/* Quick Links Grid */}
      <QuickLinksGrid />
    </div>
  )
}
