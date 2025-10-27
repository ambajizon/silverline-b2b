import { TargetKPIs } from '@/types/targets'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TargetsKPICardsProps {
  kpis: TargetKPIs
}

export default function TargetsKPICards({ kpis }: TargetsKPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Active Challenges */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 mb-1">Active Challenges</span>
          <span className="text-3xl font-bold text-slate-900">{kpis.active_challenges}</span>
          <span className="text-xs text-green-600 mt-1">↑ 2.5%</span>
        </div>
      </div>

      {/* Qualified This Month */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 mb-1">Qualified This Month</span>
          <span className="text-3xl font-bold text-green-600">{kpis.qualified_this_month}</span>
          <span className="text-xs text-green-600 mt-1">↑ 8.2%</span>
        </div>
      </div>

      {/* Not Qualified (Dues) */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 mb-1">Not Qualified (Dues)</span>
          <span className="text-3xl font-bold text-red-600">{kpis.not_qualified}</span>
          <span className="text-xs text-slate-500 mt-1">—</span>
        </div>
      </div>

      {/* Avg Progress */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 mb-1">Avg Progress</span>
          <span className="text-3xl font-bold text-slate-900">{Math.round(kpis.avg_progress)}%</span>
          <span className="text-xs text-green-600 mt-1">↑ 14%</span>
        </div>
      </div>

      {/* Expected Rewards */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 mb-1">Expected Rewards</span>
          <span className="text-2xl font-bold text-slate-900">{formatCurrency(kpis.expected_rewards)}</span>
          <span className="text-xs text-slate-500 mt-1">Pending</span>
        </div>
      </div>

      {/* ROI */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex flex-col">
          <span className="text-xs text-slate-600 mb-1">ROI</span>
          <span className="text-3xl font-bold text-blue-600">{Math.round(kpis.roi)}%</span>
          <span className="text-xs text-blue-600 mt-1">↑ 4.5%</span>
        </div>
      </div>
    </div>
  )
}
