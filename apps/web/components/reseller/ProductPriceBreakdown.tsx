import { PriceBreakdown } from '@/types/reseller'

interface ProductPriceBreakdownProps {
  breakdown: PriceBreakdown
}

export default function ProductPriceBreakdown({ breakdown }: ProductPriceBreakdownProps) {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Price Breakdown</h3>
      
      <div className="space-y-2 text-sm">
        {/* Base Price */}
        <div className="flex justify-between">
          <span className="text-slate-600">Base Price</span>
          <span className="font-medium text-slate-900">{formatINR(breakdown.base_price)}</span>
        </div>

        {/* Silver Deduction */}
        <div className="flex justify-between">
          <span className="text-slate-600">
            Silver Deduction ({breakdown.deduction_pct.toFixed(2)}%)
          </span>
          <span className="font-medium text-red-600">- {formatINR(breakdown.deduction_amount)}</span>
        </div>

        {/* Labor Charges */}
        <div className="flex justify-between">
          <span className="text-slate-600">Labor Charges</span>
          <span className="font-medium text-slate-900">+ {formatINR(breakdown.labor_charges)}</span>
        </div>

        {/* Offer Discount */}
        {breakdown.offer_discount > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-600">Offer Discount</span>
            <span className="font-medium text-green-600">- {formatINR(breakdown.offer_discount)}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 my-2"></div>

        {/* GST */}
        {breakdown.gst_rate > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-600">GST ({breakdown.gst_rate}%)</span>
            <span className="font-medium text-slate-900">+ {formatINR(breakdown.gst_amount)}</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t-2 border-slate-300 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-slate-900">Total Price</span>
            <span className="text-lg font-bold text-blue-600">{formatINR(breakdown.total_price)}</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <p className="text-xs text-slate-400 mt-3">
        Silver rate: {formatINR(breakdown.silver_rate)}/gram • Weight: {breakdown.weight_kg}kg ({breakdown.weight_kg * 1000}g)
      </p>
    </div>
  )
}
