'use client'

import { Target } from '@/types/resellers'
import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
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
                <div key={target.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{target.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                        <span>Goal: {formatCurrency(target.goal)}</span>
                        <span>•</span>
                        <span>Progress: {formatCurrency(target.current_progress || 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-slate-100 rounded" title="Edit">
                        <Edit className="h-4 w-4 text-slate-600" />
                      </button>
                      <button className="p-1 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-slate-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">Reward:</span>{' '}
                    {target.reward_type === 'percentage' ? `${target.reward_value}% Bonus` : formatCurrency(target.reward_value)}
                  </div>

                  {/* Deadline */}
                  <div className="mt-1 text-xs text-slate-600">
                    <span className="font-medium">Deadline:</span>{' '}
                    {new Date(target.deadline).toLocaleDateString('en-IN')}
                  </div>
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
