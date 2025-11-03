import { ReportFilters } from '@/types/reports'
import { getMonthlySummary, getTopProducts, getOverduePayments } from './actions'
import FilterBar from '@/components/admin/reports/FilterBar'
import ReportPreviews from '@/components/admin/reports/ReportPreviews'
import Link from 'next/link'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters: ReportFilters = {
    date_range: (sp.date_range as any) || '30d',
    date_from: sp.date_from as string,
    date_to: sp.date_to as string,
    report_type: (sp.report_type as any) || 'all',
    reseller_id: sp.reseller_id as string,
    search: sp.search as string,
  }

  // Fetch preview data
  const [monthlySummaryResult, topProductsResult, overdueResult] = await Promise.all([
    getMonthlySummary(filters),
    getTopProducts(filters),
    getOverduePayments(filters),
  ])

  const monthlySummary = monthlySummaryResult.ok ? monthlySummaryResult.data : null
  const topProducts = topProductsResult.ok ? topProductsResult.data : []
  const overduePayments = overdueResult.ok ? overdueResult.data : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600">Generate & View Reports</p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/reports/tax" className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📋</span>
            <h3 className="font-bold text-green-900">Invoice & Tax Report</h3>
          </div>
          <p className="text-sm text-green-700 mb-4 font-medium">GST invoices & payments for CA/tax filing</p>
          <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 font-semibold">
            Generate Report
          </button>
        </Link>

        <Link href="/admin/reports/sales" className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">Sales Reports</h3>
          <p className="text-sm text-slate-600 mb-4">Track sales revenue and performance</p>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            View Details
          </button>
        </Link>

        <Link href="/admin/reports/products" className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">Product Performance</h3>
          <p className="text-sm text-slate-600 mb-4">Analyze product sales and trends</p>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            View Details
          </button>
        </Link>

        <Link href="/admin/reports/resellers" className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">Reseller Activity</h3>
          <p className="text-sm text-slate-600 mb-4">Monitor reseller performance</p>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            View Details
          </button>
        </Link>
      </div>

      {/* Filters & Quick Actions */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Filters & Quick Actions</h2>
        <FilterBar filters={filters} />
      </div>

      {/* Report Previews */}
      <ReportPreviews
        monthlySummary={monthlySummary}
        topProducts={topProducts}
        overduePayments={overduePayments}
      />

      {/* Empty State / No Reports */}
      {!monthlySummary && !topProducts.length && !overduePayments && (
        <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200 text-center">
          <svg
            className="h-16 w-16 text-slate-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium text-slate-900 mb-2">No Reports Found</p>
          <p className="text-slate-600">Adjust your filters or generate a new report to get started.</p>
        </div>
      )}
    </div>
  )
}
