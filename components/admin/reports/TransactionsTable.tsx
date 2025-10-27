import { SalesTransaction } from '@/types/reports'
import { useRouter } from 'next/navigation'

interface TransactionsTableProps {
  transactions: SalesTransaction[]
  total: number
  currentPage: number
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  partial: 'bg-blue-100 text-blue-700',
}

export default function TransactionsTable({ transactions, total, currentPage }: TransactionsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>No transactions found</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Order ID</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Date</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Reseller Name</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Total Amount</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Product Count</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr key={transaction.order_id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-sm font-medium text-blue-600">
                  #{transaction.order_number}
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-600">
                  {new Date(transaction.date).toLocaleDateString('en-IN')}
                </td>
                <td className="py-3 px-4 text-sm text-slate-900">
                  {transaction.reseller_name}
                </td>
                <td className="py-3 px-4 text-center text-sm font-medium text-slate-900">
                  {formatCurrency(transaction.total_amount)}
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-600">
                  {transaction.product_count}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[transaction.payment_status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {transaction.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            <button
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  )
}
