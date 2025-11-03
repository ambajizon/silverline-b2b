import { getClaimedRewards, getRewardsCatalog } from './actions'
import { Gift, Package, TrendingUp, CheckCircle } from 'lucide-react'
import RewardsTable from '@/components/admin/rewards/RewardsTable'
import RewardsCatalog from '@/components/admin/rewards/RewardsCatalog'

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters = {
    status: sp.status as string,
    reseller_id: sp.reseller_id as string,
    page: Number(sp.page) || 1,
  }

  const [claimedResult, catalogResult] = await Promise.all([
    getClaimedRewards(filters),
    getRewardsCatalog(),
  ])

  if (!claimedResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading rewards: {claimedResult.error}
        </div>
      </div>
    )
  }

  const { rewards = [], total = 0, summary } = claimedResult.data || {}
  const catalog = catalogResult.ok ? catalogResult.data : []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rewards Management</h1>
        <p className="text-sm text-slate-600">Track and manage rewards for top performers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Gift className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Claims</p>
              <p className="text-2xl font-bold text-slate-900">{summary?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{summary?.pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Delivered</p>
              <p className="text-2xl font-bold text-slate-900">{summary?.delivered || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Value</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(summary?.totalValue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <div className="flex gap-2">
          <a
            href="/admin/rewards"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !filters.status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </a>
          <a
            href="/admin/rewards?status=pending"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filters.status === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending
          </a>
          <a
            href="/admin/rewards?status=approved"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filters.status === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Approved
          </a>
          <a
            href="/admin/rewards?status=delivered"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filters.status === 'delivered'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Delivered
          </a>
        </div>
      </div>

      {/* Claimed Rewards Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Claimed Rewards</h2>
          <p className="text-xs text-slate-600">{total} rewards claimed</p>
        </div>
        <RewardsTable rewards={rewards} />
      </div>

      {/* Rewards Catalog */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Rewards Catalog</h2>
          <p className="text-xs text-slate-600">Available prizes for achievers</p>
        </div>
        <RewardsCatalog catalog={catalog} />
      </div>
    </div>
  )
}
