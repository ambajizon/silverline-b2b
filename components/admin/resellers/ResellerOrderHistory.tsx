import { ResellerOrder } from '@/types/resellers'
import Link from 'next/link'
import { formatCurrency, formatWeight } from '@/lib/pricing'

interface ResellerOrderHistoryProps {
  orders: ResellerOrder[]
  resellerId: string
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

export default function ResellerOrderHistory({ orders, resellerId }: ResellerOrderHistoryProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Order History</h2>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-700 uppercase">Order ID</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-slate-700 uppercase">Total</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-slate-700 uppercase">Weight</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-slate-700 uppercase">Status</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-slate-700 uppercase">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline text-sm">
                      {order.order_code || `#${order.id.slice(0, 8)}`}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-sm">
                    {formatCurrency(order.total_price)}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-slate-600">
                    {formatWeight(order.total_weight_kg)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {order.payment_status || 'Unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          href={`/admin/orders?resellerId=${resellerId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          View All Orders →
        </Link>
      </div>
    </div>
  )
}
