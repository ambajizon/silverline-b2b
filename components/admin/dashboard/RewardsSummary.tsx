import { RewardItem } from '@/types/dashboard'

interface RewardsSummaryProps {
  rewards: RewardItem[]
}

export default function RewardsSummary({ rewards }: RewardsSummaryProps) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Rewards Status</h3>
      {rewards.length === 0 ? (
        <div className="text-center text-slate-400 py-6 text-sm">No rewards data available</div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 uppercase font-medium mb-2">Reseller | Status | Points</div>
          {rewards.map((r, idx) => (
            <div key={idx} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Reseller {r.reseller_id.slice(0, 8)}...</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {r.status}
                </span>
                <span className="text-sm font-bold text-slate-900">{formatter.format(r.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
