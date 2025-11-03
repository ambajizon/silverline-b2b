import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { getOrderDetail } from '@/app/(reseller)/reseller/orders/actions'

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderDetail(id)

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-6">
      {/* Success Icon */}
      <div className="bg-white rounded-lg p-6 text-center border border-slate-200 mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
        <p className="text-sm text-slate-600 mb-4">
          Thank you for your order! #{order.order_number} has been placed and is awaiting processing.
        </p>

        {/* Order Details */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Order ID</span>
            <span className="font-medium text-slate-900">#{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Estimated Delivery</span>
            <span className="font-medium text-slate-900">
              {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
            <span className="text-slate-600">Total Amount</span>
            <span className="text-lg font-bold text-blue-600">{formatINR(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href={`/reseller/orders/${order.id}`}
          className="block w-full py-3 text-center text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Order Details
        </Link>
        
        <Link
          href="/reseller"
          className="block w-full py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
