import { TargetSummary } from '@/types/reseller'
import { Trophy, Gift, Clock, CheckCircle2 } from 'lucide-react'

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
    <div className={`rounded-lg p-4 shadow-sm border-2 ${
      target.is_qualified 
        ? 'border-yellow-300 bg-yellow-50' 
        : 'border-slate-200 bg-white'
    }`}>
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Active Targets</h2>

      <div>
        {/* Target Info */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            {target.is_qualified && <Trophy className="h-4 w-4 text-yellow-600 flex-shrink-0" />}
            <h3 className="text-sm font-semibold text-slate-900">{target.name}</h3>
          </div>
          <p className="text-xs text-slate-600">
            Goal: {formatINR(target.goal_value)} • {target.days_left} days left
          </p>
          
          {/* Reward Status Badge */}
          {target.is_qualified && target.reward_status && (
            <div className="mt-2">
              {target.reward_status === 'delivered' ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Reward Received
                </span>
              ) : target.reward_status === 'approved' ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <Gift className="h-3 w-3" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  <Clock className="h-3 w-3" />
                  Pending Approval
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-medium ${
              target.is_qualified ? 'text-green-600' : 'text-slate-600'
            }`}>{target.progress_pct}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                target.is_qualified ? 'bg-green-500' : 'bg-yellow-400'
              }`}
              style={{ width: `${Math.min(target.progress_pct, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Congratulations Message */}
        {target.is_qualified && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
            <p className="text-green-700 font-medium">🎉 Congratulations! Target Achieved!</p>
            {target.reward_status === 'delivered' && target.reward_delivered_date && (
              <p className="text-green-600 mt-1">
                Reward delivered on {new Date(target.reward_delivered_date).toLocaleDateString('en-IN')}
              </p>
            )}
            {target.reward_status === 'approved' && (
              <p className="text-blue-600 mt-1">Your reward is approved and will be delivered soon!</p>
            )}
            {target.reward_status === 'pending' && (
              <p className="text-yellow-700 mt-1">Your reward is pending admin approval.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
