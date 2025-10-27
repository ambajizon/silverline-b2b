import { getResellerPaymentSummary, getResellerPaymentHistory } from './actions'
import ResellerPaymentView from '@/components/reseller/ResellerPaymentView'

export default async function ResellerPaymentsPage() {
  const [summaryResult, historyResult] = await Promise.all([
    getResellerPaymentSummary(),
    getResellerPaymentHistory(),
  ])

  if (!summaryResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading payment summary: {summaryResult.error}
        </div>
      </div>
    )
  }

  if (!historyResult.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading payment history: {historyResult.error}
        </div>
      </div>
    )
  }

  return (
    <ResellerPaymentView 
      summary={summaryResult.data}
      history={historyResult.data}
    />
  )
}
