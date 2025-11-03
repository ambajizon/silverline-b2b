import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTopProducts } from '../actions'
import { ReportFilters } from '@/types/reports'

export default async function ProductsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters: ReportFilters = {
    date_range: (sp.date_range as any) || '30d',
    date_from: sp.date_from as string,
    date_to: sp.date_to as string,
    report_type: 'all' as any,
    reseller_id: sp.reseller_id as string,
    search: sp.search as string,
  }

  const productsResult = await getTopProducts(filters)
  const products = productsResult.ok ? productsResult.data : []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/reports"
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Product Performance</h1>
        <p className="text-sm text-slate-600">Analyze product sales and trends</p>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Top Products</h2>
          <p className="text-xs text-slate-600">Best selling products by revenue</p>
        </div>

        {products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">No product data available</p>
            <p className="text-xs text-slate-500 mt-2">Products will appear here once orders are delivered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Rank</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Product Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Units Sold</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product, index) => (
                  <tr key={product.product_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-600">#{index + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{product.product_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{product.category_name}</td>
                    <td className="py-3 px-4 text-sm text-right text-slate-900">{product.units_sold}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
