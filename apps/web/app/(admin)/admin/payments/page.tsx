import { PaymentFilters } from '@/types/payments'
import { getPaymentsDashboardStats, getPaymentsTable } from './actions'
import PaymentsFilters from '@/components/admin/payments/PaymentsFilters'
import PaymentsStats from '@/components/admin/payments/PaymentsStats'
import PaymentsTable from '@/components/admin/payments/PaymentsTable'
import RecordPaymentButton from '@/components/admin/payments/RecordPaymentButton'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters: PaymentFilters = {
    status: sp.status as any,
    date_from: sp.date_from as string,
    date_to: sp.date_to as string,
    reseller_id: sp.reseller_id as string,
    aging_bucket: sp.aging_bucket as any,
    search: sp.search as string,
    page: Number(sp.page) || 1,
  }

  // Fetch stats and table data in parallel
  const [statsResult, tableResult] = await Promise.all([
    getPaymentsDashboardStats(filters.date_from, filters.date_to, filters.reseller_id),
    getPaymentsTable(filters),
  ])

  if (!statsResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading payment stats: {statsResult.error}
        </div>
      </div>
    )
  }

  if (!tableResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading payments table: {tableResult.error}
        </div>
      </div>
    )
  }

  const stats = statsResult.data
  const { payments = [], total = 0 } = tableResult.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-600">Payment Management</p>
        </div>
        <RecordPaymentButton />
      </div>

      {/* Filters */}
      <PaymentsFilters />

      {/* Stats Cards + Pie Chart */}
      <PaymentsStats stats={stats} />

      {/* Outstanding note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-700">
          Outstanding totals may affect reseller qualification for sales targets.{' '}
          <a href="#" className="underline font-medium">Learn more</a>
        </p>
      </div>

      {/* Table */}
      <PaymentsTable payments={payments} total={total} currentPage={filters.page || 1} />
    </div>
  )
}
