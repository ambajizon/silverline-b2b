interface FinancialDetailsCardProps {
  creditLimit: number | null
  discountPercent: number | null
  extraChargesPercent: number | null
  paymentTerms: string | null
}

export default function FinancialDetailsCard({
  creditLimit,
  discountPercent,
  extraChargesPercent,
  paymentTerms,
}: FinancialDetailsCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not set'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return 'Not set'
    return `${value}%`
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Financial Details</h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Credit Limit */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-700 mb-1">Credit Limit</p>
          <p className="text-base font-bold text-blue-900">{formatCurrency(creditLimit)}</p>
        </div>

        {/* Discount */}
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-700 mb-1">Discount</p>
          <p className="text-base font-bold text-green-900">{formatPercent(discountPercent)}</p>
        </div>

        {/* Global Loop */}
        <div className="bg-amber-50 rounded-lg p-3">
          <p className="text-xs text-amber-700 mb-1">Global Loop</p>
          <p className="text-base font-bold text-amber-900">{formatPercent(extraChargesPercent)}</p>
        </div>

        {/* Payment Terms */}
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-700 mb-1">Payment Terms</p>
          <p className="text-base font-bold text-purple-900">{paymentTerms || 'Not set'}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        These financial details are set by the admin and cannot be modified.
      </p>
    </div>
  )
}
