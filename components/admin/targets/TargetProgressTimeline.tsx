import { TargetProgress } from '@/types/targets'
import { Plus, TrendingUp } from 'lucide-react'

interface TargetProgressTimelineProps {
  progress: TargetProgress[]
  onAddProgress: () => void
}

export default function TargetProgressTimeline({ progress, onAddProgress }: TargetProgressTimelineProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Progress Timeline</h2>
        <button
          onClick={onAddProgress}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Progress
        </button>
      </div>

      {progress.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm">No progress recorded yet</p>
          <button
            onClick={onAddProgress}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Add the first progress entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {progress.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
                {index < progress.length - 1 && (
                  <div className="w-0.5 h-full bg-slate-200 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {entry.delta_value > 0 ? '+' : ''}{formatCurrency(entry.delta_value)}
                    </p>
                    <p className="text-xs text-slate-600">
                      New total: {formatCurrency(entry.current_value)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(entry.updated_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded">
                    {entry.note}
                  </p>
                )}
                {entry.updated_by && (
                  <p className="text-xs text-slate-500 mt-1">
                    Updated by: {entry.updated_by}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
