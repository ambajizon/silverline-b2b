import { PaymentsSummary as PaymentsSummaryType } from '@/types/dashboard'

interface PaymentsSummaryProps {
  summary: PaymentsSummaryType
}

export default function PaymentsSummary({ summary }: PaymentsSummaryProps) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Payments Summary</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-sm text-slate-600">Received:</span>
          <span className="text-lg font-bold text-emerald-600">{formatter.format(summary.received)}</span>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-sm text-slate-600">Pending:</span>
          <span className="text-lg font-bold text-yellow-600">{formatter.format(summary.pending)}</span>
        </div>
        <div className="flex items-center justify-between pb-2">
          <span className="text-sm text-slate-600">Overdue:</span>
          <span className="text-lg font-bold text-red-600">{formatter.format(summary.overdue)}</span>
        </div>
      </div>
      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
        Record Payment
      </button>
    </div>
  )
}
