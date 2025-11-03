import { MonthlySummary, TopProduct, OverduePayment } from '@/types/reports'

interface ReportPreviewsProps {
  monthlySummary: MonthlySummary | null
  topProducts: TopProduct[]
  overduePayments: OverduePayment | null
}

export default function ReportPreviews({ monthlySummary, topProducts, overduePayments }: ReportPreviewsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Previews</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Sales Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Sales Summary</h3>
          {monthlySummary ? (
            <>
              <p className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(monthlySummary.total_revenue)}
              </p>
              <p className="text-sm text-slate-600 mb-4">
                {monthlySummary.total_orders} orders
              </p>
              <p className="text-xs text-slate-500">
                {monthlySummary.growth_percent >= 0 ? '↑' : '↓'} {Math.abs(monthlySummary.growth_percent).toFixed(1)}% from last period
              </p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 w-full">
                View Full
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400">No data available</p>
          )}
        </div>

        {/* Top 5 Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Top 5 Products</h3>
          {topProducts.length > 0 ? (
            <>
              <ul className="space-y-3 mb-4">
                {topProducts.slice(0, 5).map((product, index) => (
                  <li key={product.product_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 truncate" title={product.product_name}>
                          {product.product_name.length > 20 ? product.product_name.substring(0, 20) + '...' : product.product_name}
                        </p>
                        <p className="text-xs text-slate-500">{product.category_name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{product.units_sold} units</span>
                  </li>
                ))}
              </ul>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 w-full">
                View All
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400">No products found</p>
          )}
        </div>

        {/* Overdue Payments */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Overdue Payments</h3>
          {overduePayments ? (
            <>
              <p className="text-3xl font-bold text-red-600 mb-2">{overduePayments.count} Invoices</p>
              <p className="text-2xl font-semibold text-red-500 mb-4">{formatCurrency(overduePayments.total_amount)}</p>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 w-full">
                View All
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400">No overdue payments</p>
          )}
        </div>
      </div>
    </div>
  )
}
