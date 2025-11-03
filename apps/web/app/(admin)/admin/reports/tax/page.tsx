import { getTaxReport, getInvoiceDetails, getPaymentDetails } from './actions'
import TaxReportView from '@/components/admin/reports/TaxReportView'

export default async function TaxReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters = {
    date_from: sp.date_from as string || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    date_to: sp.date_to as string || new Date().toISOString().split('T')[0],
    include_gst: true, // Always include GST details
    reseller_id: sp.reseller_id as string,
  }

  const [taxReportResult, invoicesResult, paymentsResult] = await Promise.all([
    getTaxReport(filters),
    getInvoiceDetails(filters),
    getPaymentDetails(filters),
  ])

  if (!taxReportResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading tax report: {taxReportResult.error}
        </div>
      </div>
    )
  }

  return (
    <TaxReportView
      filters={filters}
      summary={taxReportResult.data}
      invoices={invoicesResult.ok ? invoicesResult.data : []}
      payments={paymentsResult.ok ? paymentsResult.data : []}
    />
  )
}
