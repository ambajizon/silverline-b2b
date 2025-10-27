'use client'

import { PaymentWithDetails } from '@/types/payments'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Download, Printer } from 'lucide-react'
import RecordPaymentModal from './RecordPaymentModal'

interface PaymentsTableProps {
  payments: PaymentWithDetails[]
  total: number
  currentPage: number
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  partial: 'bg-blue-100 text-blue-700',
}

export default function PaymentsTable({ payments, total, currentPage }: PaymentsTableProps) {
  const router = useRouter()
  const perPage = 20
  const totalPages = Math.ceil(total / perPage)
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`/admin/payments?${params.toString()}`)
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200 text-center">
        <p className="text-slate-600">No payments found</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="text-sm font-medium text-slate-900">All Payments</div>
          <div className="text-sm text-slate-600">
            Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, total)} of {total} results
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Reseller Name</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Total Invoiced</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Total Received</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Outstanding</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.reseller_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">
                    {payment.reseller_name}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-slate-600">
                    {formatCurrency(payment.invoiced || 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-green-600 font-medium">
                    {formatCurrency(payment.received || 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-medium">
                    <span
                      className={`${
                        payment.outstanding > 0
                          ? 'text-red-600'
                          : payment.outstanding < 0
                          ? 'text-blue-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {formatCurrency(payment.outstanding || 0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[payment.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-1.5 hover:bg-slate-100 rounded"
                        title="Record Payment"
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
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
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedPayment && (
        <RecordPaymentModal
          resellerId={selectedPayment.reseller_id}
          resellerName={selectedPayment.reseller_name}
          amountDue={selectedPayment.outstanding}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </>
  )
}
