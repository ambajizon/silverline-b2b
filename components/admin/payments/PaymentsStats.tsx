import { PaymentStats } from '@/types/payments'

interface PaymentsStatsProps {
  stats: PaymentStats
}

export default function PaymentsStats({ stats }: PaymentsStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Defensive defaults to prevent crashes
  const pb = stats?.payment_breakdown ?? { paid: 0, unpaid_overdue: 0, partial: 0 }
  
  const total = pb.paid + pb.unpaid_overdue + pb.partial
  const paidPercent = total > 0 ? (pb.paid / total) * 100 : 0
  const unpaidPercent = total > 0 ? (pb.unpaid_overdue / total) * 100 : 0
  const partialPercent = total > 0 ? (pb.partial / total) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Outstanding */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <p className="text-xs text-slate-600 mb-1">Total Outstanding</p>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.total_outstanding ?? 0)}</p>
      </div>

      {/* Total Received */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <p className="text-xs text-slate-600 mb-1">Total Received</p>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.total_received ?? 0)}</p>
      </div>

      {/* Total Invoiced */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <p className="text-xs text-slate-600 mb-1">Total Invoiced</p>
        <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.total_invoiced ?? 0)}</p>
      </div>

      {/* Unpaid/Overdue */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <p className="text-xs text-slate-600 mb-1">Unpaid/Overdue</p>
        <p className="text-2xl font-bold text-orange-600">{formatCurrency(pb.unpaid_overdue)}</p>
      </div>

      {/* Payment Breakdown Pie Chart */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <p className="text-xs text-slate-600 mb-2 font-medium">Payment Breakdown</p>
        
        {/* Pie Chart */}
        <div className="relative w-32 h-32 mx-auto mb-3">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {/* Paid (Green) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#22c55e"
              strokeWidth="20"
              strokeDasharray={`${paidPercent * 2.51} 251`}
              strokeDashoffset="0"
            />
            {/* Unpaid/Overdue (Red) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray={`${unpaidPercent * 2.51} 251`}
              strokeDashoffset={`-${paidPercent * 2.51}`}
            />
            {/* Partial (Yellow) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#eab308"
              strokeWidth="20"
              strokeDasharray={`${partialPercent * 2.51} 251`}
              strokeDashoffset={`-${(paidPercent + unpaidPercent) * 2.51}`}
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-600">Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-600">Unpaid/Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-slate-600">Partial</span>
          </div>
        </div>
      </div>
    </div>
  )
}
