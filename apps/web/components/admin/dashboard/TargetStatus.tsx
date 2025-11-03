import { TargetSummary } from '@/types/dashboard'

interface TargetStatusProps {
  summary: TargetSummary
}

export default function TargetStatus({ summary }: TargetStatusProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Target Status</h3>
      
      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Reseller Targets Progress</span>
          <span className="text-sm font-bold text-slate-900">{summary.overallPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${summary.overallPercentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">{summary.overallPercentage}% achieved</p>
      </div>

      {/* Top Performers */}
      {summary.topPerformers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase font-medium mb-2">Top Performers</p>
          {summary.topPerformers.map((performer) => (
            <div key={performer.resellerId} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{performer.resellerName}</p>
                <p className="text-xs text-slate-500">
                  ₹{performer.achievedAmount.toLocaleString()} / ₹{performer.targetAmount.toLocaleString()}
                </p>
              </div>
              <div className="ml-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  performer.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' :
                  performer.percentage >= 50 ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {performer.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
