import { SilverRateTrend } from '@/types/dashboard'
import Link from 'next/link'

interface TrendCardProps {
  trends: SilverRateTrend[]
}

export default function TrendCard({ trends }: TrendCardProps) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">Silver Rate Trend (Last 7 Days)</h3>
        <div className="flex gap-2">
          <Link href="/admin/settings?tab=silver-rate" className="text-xs text-slate-600 hover:text-slate-900">View History</Link>
          <Link href="/admin/settings?tab=silver-rate" className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">Update Rate</Link>
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <p className="text-sm">Live chart placeholder</p>
          <p className="text-xs mt-1">No trend data available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trends.map((t, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
              <span className="text-slate-600">{new Date(t.day).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
              <span className="font-medium text-slate-900">{formatter.format(t.rate)}/gm</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
