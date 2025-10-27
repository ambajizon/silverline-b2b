import { ReportFilters } from '@/types/reports'
import { getSalesKPIs, getSalesTrend, getSalesByCategory, getSalesTransactions } from '../actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import KpiRow from '@/components/admin/reports/KpiRow'
import SalesTrendChart from '@/components/admin/reports/SalesTrendChart'
import SalesByCategoryChart from '@/components/admin/reports/SalesByCategoryChart'
import TransactionsTable from '@/components/admin/reports/TransactionsTable'
import ExportButton from '@/components/admin/reports/ExportButton'

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters: ReportFilters = {
    date_range: (sp.date_range as any) || '30d',
    date_from: sp.date_from as string,
    date_to: sp.date_to as string,
    report_type: 'sales',
    reseller_id: sp.reseller_id as string,
    search: sp.search as string,
  }

  const page = Number(sp.page) || 1

  // Fetch all data in parallel
  const [kpisResult, trendResult, categoryResult, transactionsResult] = await Promise.all([
    getSalesKPIs(filters),
    getSalesTrend(filters),
    getSalesByCategory(filters),
    getSalesTransactions(filters, page),
  ])

  if (!kpisResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading sales report: {kpisResult.error}
        </div>
      </div>
    )
  }

  const kpis = kpisResult.data
  const trend = trendResult.ok ? trendResult.data : []
  const categories = categoryResult.ok ? categoryResult.data : []
  const transactions = transactionsResult.ok ? transactionsResult.data : { data: [], total: 0 }

  const dateRangeLabel = filters.date_range === '7d' ? 'Last 7 Days'
    : filters.date_range === '30d' ? 'Last 30 Days'
    : filters.date_range === '90d' ? 'Last 90 Days'
    : 'Custom Range'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/reports" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sales Report</h1>
              <p className="text-sm text-slate-600">Sales Report: {dateRangeLabel}</p>
            </div>
          </div>
        </div>
        <Link href="/admin/reports" className="text-sm text-blue-600 hover:underline">
          Back to Reports
        </Link>
      </div>

      {/* KPIs */}
      <KpiRow kpis={kpis} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales Trend</h2>
          {trend.length > 0 ? (
            <SalesTrendChart data={trend} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <p>Line Chart Placeholder</p>
            </div>
          )}
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales by Category</h2>
          {categories.length > 0 ? (
            <SalesByCategoryChart data={categories} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <p>Bar Chart Placeholder</p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Detailed Sales Transactions</h2>
          <ExportButton filters={filters} />
        </div>
        <TransactionsTable
          transactions={transactions.data}
          total={transactions.total}
          currentPage={page}
        />
      </div>
    </div>
  )
}
