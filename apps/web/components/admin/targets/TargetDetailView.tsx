'use client'

import { TargetDetail } from '@/types/targets'
import { useState, useEffect } from 'react'
import { Pencil, AlertCircle } from 'lucide-react'
import TargetProgressTimeline from './TargetProgressTimeline'
import AddProgressModal from './AddProgressModal'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface TargetDetailViewProps {
  target: TargetDetail
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-red-100 text-red-700',
  suspended: 'bg-orange-100 text-orange-700',
}

const typeLabels: Record<string, string> = {
  purchase_value: 'Purchase Value',
  weight: 'Weight',
  order_count: 'Order Count',
  category_specific: 'Category Specific',
  revenue: 'Revenue',
}

export default function TargetDetailView({ target: initialTarget }: TargetDetailViewProps) {
  const [target, setTarget] = useState(initialTarget)
  const [showAddProgress, setShowAddProgress] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Realtime subscription for target_progress
  useEffect(() => {
    const supabase = supabaseBrowser()
    const channel = supabase
      .channel(`target-progress-${target.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'target_progress',
          filter: `target_id=eq.${target.id}`,
        },
        (payload) => {
          console.log('Progress update received:', payload)
          // Refetch target detail
          window.location.reload()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [target.id])

  const daysUntilDeadline = Math.ceil(
    (new Date(target.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const formatGoal = () => {
    if (target.type === 'purchase_value' || target.type === 'revenue') {
      return formatCurrency(target.goal)
    }
    return target.goal.toLocaleString()
  }

  const formatProgress = () => {
    if (target.type === 'purchase_value' || target.type === 'revenue') {
      return formatCurrency(target.current_progress)
    }
    return target.current_progress.toLocaleString()
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Info Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">{target.name}</h2>
                <p className="text-sm text-slate-600">
                  {target.reseller_name || 'Open to all resellers'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[target.status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {target.status.replace('_', ' ')}
                </span>
                <button className="p-2 hover:bg-slate-100 rounded-lg">
                  <Pencil className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <span className="text-sm font-medium text-slate-900">
                  {Math.round(target.progress_percentage)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, target.progress_percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-slate-600">
                  Current: <span className="font-medium text-slate-900">{formatProgress()}</span>
                </span>
                <span className="text-slate-600">
                  Goal: <span className="font-medium text-slate-900">{formatGoal()}</span>
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-600 mb-1">Type</p>
                <p className="font-medium text-slate-900">{typeLabels[target.type]}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Deadline</p>
                <p className="font-medium text-slate-900">
                  {new Date(target.deadline).toLocaleDateString('en-IN')}
                </p>
                {daysUntilDeadline >= 0 && (
                  <p className="text-xs text-slate-500">{daysUntilDeadline} days left</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Reward</p>
                <p className="font-medium text-slate-900">
                  {target.reward_value
                    ? target.reward_type === 'cashback'
                      ? formatCurrency(target.reward_value)
                      : `${target.reward_value}%`
                    : 'None'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Qualification</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    target.is_qualified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {target.is_qualified ? 'Qualified' : 'Not Qualified'}
                </span>
              </div>
            </div>

            {/* Terms & Notes */}
            {(target.terms || target.notes) && (
              <div className="mt-4 space-y-3">
                {target.terms && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">Terms</p>
                    <p className="text-sm text-slate-600">{target.terms}</p>
                  </div>
                )}
                {target.notes && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1">Notes</p>
                    <p className="text-sm text-slate-600">{target.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Timeline */}
          <TargetProgressTimeline
            progress={target.progress_history || []}
            onAddProgress={() => setShowAddProgress(true)}
          />
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Qualification Status */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-start gap-3">
              <AlertCircle className={`h-5 w-5 ${target.is_qualified ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {target.is_qualified ? 'Qualified' : 'Not Qualified'}
                </h3>
                <p className="text-sm text-slate-600">
                  {target.is_qualified
                    ? 'This reseller has met the target goal and qualifies for the reward.'
                    : 'Target goal not yet achieved. Additional progress needed to qualify.'}
                </p>
              </div>
            </div>

            {target.is_qualified && target.reward_value && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900">Expected Reward</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {target.reward_type === 'cashback'
                    ? formatCurrency(target.reward_value)
                    : `${target.reward_value}% ${target.reward_type}`}
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Created</span>
                <span className="text-sm font-medium text-slate-900">
                  {new Date(target.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Last Updated</span>
                <span className="text-sm font-medium text-slate-900">
                  {new Date(target.updated_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Progress Entries</span>
                <span className="text-sm font-medium text-slate-900">
                  {target.progress_history?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Progress Modal */}
      {showAddProgress && (
        <AddProgressModal
          targetId={target.id}
          targetName={target.name}
          onClose={() => setShowAddProgress(false)}
        />
      )}
    </>
  )
}
