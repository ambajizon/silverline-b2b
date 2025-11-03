import { getQualifiedResellers, getRewardsHistory } from './actions'
import { Trophy, Gift, CheckCircle, Truck } from 'lucide-react'
import QualifiedResellersTable from '@/components/admin/rewards/QualifiedResellersTable'

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters = {
    status: sp.status as string,
    page: Number(sp.page) || 1,
  }

  const [qualifiedResult, historyResult] = await Promise.all([
    getQualifiedResellers(filters),
    getRewardsHistory(),
  ])

  if (!qualifiedResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading rewards: {qualifiedResult.error}
        </div>
      </div>
    )
  }

  const { qualified = [], total = 0 } = qualifiedResult.data || {}
  const history = historyResult.ok ? historyResult.data : []

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Qualified Resellers</p>
              <p className="text-2xl font-bold text-slate-900">
                {qualified.filter((r: any) => r.reward_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Gift className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-slate-900">
                {qualified.filter((r: any) => r.reward_status === 'approved').length}
              </p>
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
              <p className="text-2xl font-bold text-slate-900">
                {qualified.filter((r: any) => r.reward_status === 'delivered').length}
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
            All Qualified
          </a>
          <a
            href="/admin/rewards?status=pending"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filters.status === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Awaiting Approval
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

      {/* Qualified Resellers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Qualified Resellers</h2>
          <p className="text-xs text-slate-600">{total} resellers qualified for rewards</p>
        </div>
        <QualifiedResellersTable qualified={qualified} />
      </div>

      {/* Winners History */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">🏆 Rewards History - All Winners</h2>
          <p className="text-xs text-slate-600">{history.length} rewards delivered</p>
        </div>
        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              No rewards delivered yet
            </div>
          ) : (
            history.map((item: any) => (
              <div key={item.target_id} className="p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.reseller_name}</p>
                      <p className="text-xs text-slate-600">{item.target_name}</p>
                      <p className="text-xs text-slate-500">Goal: {item.goal_display} | Achieved: {item.achieved_display}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Delivered on</p>
                    <p className="text-sm font-medium text-slate-900">{new Date(item.delivered_date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
