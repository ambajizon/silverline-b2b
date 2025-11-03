'use client'

import { OrderWithReseller } from '@/types/orders'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Edit, Printer, MoreHorizontal } from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/pricing'

interface OrdersTableProps {
  orders: OrderWithReseller[]
  total: number
  currentPage: number
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_making: 'bg-purple-100 text-purple-700',
  dispatched: 'bg-emerald-100 text-emerald-700',
  delivered: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

export default function OrdersTable({ orders, total, currentPage }: OrdersTableProps) {
  const router = useRouter()
  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`/admin/orders?${params.toString()}`)
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 text-center">
        <p className="text-slate-600">No orders found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, total)} of {total}
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
          Export Data
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Order ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Reseller Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Date</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-700 uppercase">Total</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-700 uppercase">Weight</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Payment Status</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline font-medium">
                    {order.order_code}
                  </Link>
                </td>
                <td className="py-3 px-4 text-slate-900">{order.reseller_name}</td>
                <td className="py-3 px-4 text-slate-600 text-sm">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4 text-right font-medium text-slate-900">
                  {formatCurrency(order.total_price)}
                </td>
                <td className="py-3 px-4 text-right text-slate-600 text-sm">
                  {formatWeight(order.total_weight_kg)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[order.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      (order as any).payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : (order as any).payment_status === 'partial'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {(order as any).payment_status || 'unpaid'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-1.5 hover:bg-slate-100 rounded"
                      title="View"
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                    </Link>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-1.5 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-slate-600" />
                    </Link>
                    <button className="p-1.5 hover:bg-slate-100 rounded" title="Print">
                      <Printer className="h-4 w-4 text-slate-600" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded" title="More">
                      <MoreHorizontal className="h-4 w-4 text-slate-600" />
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
  )
}
