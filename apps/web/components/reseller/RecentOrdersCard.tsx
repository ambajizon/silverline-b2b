import Link from 'next/link'
import { OrderRow } from '@/types/reseller'

interface RecentOrdersCardProps {
  orders: OrderRow[]
}

const statusColors = {
  pending: 'bg-slate-50 text-slate-700',
  accepted: 'bg-blue-50 text-blue-700',
  in_making: 'bg-amber-50 text-amber-700',
  dispatched: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-rose-50 text-rose-700',
}

const statusLabels = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_making: 'In Making',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export default function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
        <Link 
          href="/reseller/orders" 
          className="text-xs text-blue-600 hover:underline"
        >
          View All
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 mb-2">No orders yet</p>
          <Link 
            href="/reseller/products" 
            className="text-xs text-blue-600 hover:underline"
          >
            Place your first order
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/reseller/orders/${order.id}`}
              className="block border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.order_code}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { 
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    statusColors[order.status]
                  }`}
                >
                  {statusLabels[order.status]}
                </span>
              </div>
              <p className="text-base font-semibold text-slate-900">
                {formatINR(order.total_amount)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
