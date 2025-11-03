import { TargetSummary } from '@/types/reseller'

interface ActiveTargetsCardProps {
  target: TargetSummary | null
}

export default function ActiveTargetsCard({ target }: ActiveTargetsCardProps) {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!target) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Active Targets</h2>
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 mb-2">No active targets</p>
          <p className="text-xs text-slate-400">Check with your admin for new targets</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Active Targets</h2>

      <div>
        {/* Target Info */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium text-slate-900">{target.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Goal: {formatINR(target.goal_value)} • {target.days_left} days left
            </p>
          </div>
          {target.reward && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium whitespace-nowrap ml-2">
              {target.reward}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600">{target.progress_pct}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-yellow-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(target.progress_pct, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
