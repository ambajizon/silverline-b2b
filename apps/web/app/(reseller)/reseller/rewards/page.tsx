import { getResellerRewards } from './actions'
import { Trophy, Gift, Clock, CheckCircle2 } from 'lucide-react'

export default async function ResellerRewardsPage() {
  const result = await getResellerRewards()

  if (!result.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error}
        </div>
      </div>
    )
  }

  const { qualified = [], inProgress = [] } = result.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🏆 My Rewards</h1>
        <p className="text-sm text-slate-600 mt-1">
          Your qualified targets and rewards status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-yellow-200 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-xs text-yellow-700 font-medium">Qualified</p>
              <p className="text-2xl font-bold text-yellow-900">{qualified.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-200 flex items-center justify-center">
              <Gift className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Rewards Received</p>
              <p className="text-2xl font-bold text-blue-900">
                {qualified.filter(q => q.reward_status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center">
              <Clock className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <p className="text-xs text-slate-700 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">{inProgress.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Qualified Targets - Rewards */}
      {qualified.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">🎉 Your Qualified Targets</h2>
            <p className="text-xs text-slate-600">{qualified.length} targets achieved</p>
          </div>
          <div className="divide-y divide-slate-100">
            {qualified.map((target: any) => (
              <div key={target.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Trophy className="h-7 w-7 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{target.name}</h3>
                        {target.reward_status === 'delivered' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Reward Received
                          </span>
                        )}
                        {target.reward_status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Gift className="h-3 w-3" />
                            Approved - Pending Delivery
                          </span>
                        )}
                        {target.reward_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <Clock className="h-3 w-3" />
                            Awaiting Approval
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-slate-600">Goal: </span>
                          <span className="font-medium text-slate-900">{target.goal_display}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Achieved: </span>
                          <span className="font-semibold text-green-600">{target.achieved_display}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Progress: </span>
                          <span className="font-semibold text-blue-600">{target.progress_percentage}%</span>
                        </div>
                      </div>
                      {target.reward_approved_date && (
                        <p className="text-xs text-slate-500 mt-2">
                          Approved on: {new Date(target.reward_approved_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                      {target.reward_delivered_date && (
                        <p className="text-xs text-green-600 font-medium mt-2">
                          🎁 Reward delivered on: {new Date(target.reward_delivered_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Targets */}
      {inProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">🎯 Targets In Progress</h2>
            <p className="text-xs text-slate-600">Keep going to earn rewards!</p>
          </div>
          <div className="divide-y divide-slate-100">
            {inProgress.map((target: any) => (
              <div key={target.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{target.name}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Goal: </span>
                        <span className="font-medium text-slate-900">{target.goal_display}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Achieved: </span>
                        <span className="font-medium text-blue-600">{target.achieved_display}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{target.progress_percentage}%</div>
                    <p className="text-xs text-slate-600">Progress</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${target.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {qualified.length === 0 && inProgress.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <Trophy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No targets yet</p>
          <p className="text-sm text-slate-500 mt-2">
            Start achieving targets to earn rewards!
          </p>
        </div>
      )}
    </div>
  )
}
