'use client'

import { Target } from '@/types/resellers'
import { useState } from 'react'
import { Plus, Edit, Trash2, Trophy, Gift, Clock, CheckCircle2 } from 'lucide-react'
import CreateTargetModal from './CreateTargetModal'
import { formatCurrency } from '@/lib/pricing'

interface ResellerTargetsProps {
  targets: Target[]
  resellerId: string
}

export default function ResellerTargets({ targets, resellerId }: ResellerTargetsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min(100, Math.round((current / goal) * 100))
  }

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Personalized Targets</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create New Target
          </button>
        </div>

        {targets.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No targets set yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {targets.map((target) => {
              const progress = getProgressPercentage(target.current_progress || 0, target.goal)
              
              return (
                <div key={target.id} className={`border-2 rounded-lg p-4 ${
                  target.is_qualified 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {target.is_qualified && <Trophy className="h-5 w-5 text-yellow-600" />}
                        <h3 className="font-semibold text-slate-900">{target.name}</h3>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                        <span>Goal: {formatCurrency(target.goal)}</span>
                        <span>•</span>
                        <span className={target.is_qualified ? 'text-green-600 font-semibold' : ''}>
                          Progress: {formatCurrency(target.current_progress || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {target.is_qualified && (
                        <div className="text-right">
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
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className={`font-semibold ${
                        target.is_qualified ? 'text-green-600' : 'text-slate-900'
                      }`}>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          target.is_qualified ? 'bg-green-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Message */}
                  {target.is_qualified ? (
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
                  ) : (
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        <span className="font-medium">Deadline:</span>{' '}
                        {new Date(target.deadline).toLocaleDateString('en-IN')}
                      </span>
                      <span className="text-blue-600 font-medium">
                        {formatCurrency(target.goal - (target.current_progress || 0))} to go!
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTargetModal
          resellerId={resellerId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}
