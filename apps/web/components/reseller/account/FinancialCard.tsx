interface FinancialCardProps {
  creditLimit: number
  discountPct: number
  extraChargesPct: number
  paymentTerms: string | null
  outstanding: number
}

export default function FinancialCard({
  creditLimit,
  discountPct,
  extraChargesPct,
  paymentTerms,
  outstanding,
}: FinancialCardProps) {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Financial Details</h2>

      <div className="space-y-3">
        {/* Credit Limit */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Credit Limit</span>
          <span className="text-sm font-semibold text-slate-900">{formatINR(creditLimit)}</span>
        </div>

        {/* Discount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Discount</span>
          <span className="text-sm font-semibold text-slate-900">{discountPct}%</span>
        </div>

        {/* Global Loop */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Global Loop</span>
          <span className="text-sm font-semibold text-slate-900">{extraChargesPct}%</span>
        </div>

        {/* Payment Terms */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Payment Terms</span>
          <span className="text-sm font-semibold text-slate-900">{paymentTerms ?? 'N/A'}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 my-2"></div>

        {/* Current Outstanding */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">Current Outstanding</span>
          <span
            className={`text-base font-bold ${
              outstanding > 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {formatINR(outstanding)}
          </span>
        </div>

        {outstanding > 0 && (
          <p className="text-xs text-red-600 bg-red-50 rounded p-2">
            You have an outstanding balance. Please clear dues for uninterrupted service.
          </p>
        )}
      </div>
    </div>
  )
}
