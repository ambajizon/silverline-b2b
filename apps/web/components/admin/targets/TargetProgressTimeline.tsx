import { TargetProgress } from '@/types/targets'
import { Package, TrendingUp, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface TargetProgressTimelineProps {
  progress: TargetProgress[]
  onAddProgress: () => void
  targetId: string
  resellerId: string
  targetCreatedAt: string
  targetDeadline: string
}

type OrderEntry = {
  id: string
  order_code: string
  created_at: string
  status: string
  total_price: number
  total_weight_kg: number
  payment_status: string
}

export default function TargetProgressTimeline({ 
  progress, 
  onAddProgress, 
  targetId, 
  resellerId,
  targetCreatedAt,
  targetDeadline 
}: TargetProgressTimelineProps) {
  const [orders, setOrders] = useState<OrderEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = supabaseBrowser()
      const { data } = await supabase
        .from('orders')
        .select('id, order_code, created_at, status, total_price, total_weight_kg, payment_status')
        .eq('reseller_id', resellerId)
        .gte('created_at', targetCreatedAt)
        .lte('created_at', targetDeadline)
        .order('created_at', { ascending: false })

      // Check reseller's overall outstanding first
      const { data: outstandingData } = await supabase
        .from('v_reseller_outstanding')
        .select('outstanding')
        .eq('reseller_id', resellerId)
        .maybeSingle()
      
      const resellerOutstanding = Number(outstandingData?.outstanding || 0)

      // Get payment status for each order
      if (data) {
        const ordersWithPayments = await Promise.all(
          data.map(async (order) => {
            let paymentStatus = 'unpaid'
            
            // If reseller has no outstanding, all delivered orders are considered paid
            if (resellerOutstanding <= 0 && order.status === 'delivered') {
              paymentStatus = 'paid'
            } else {
              // Check individual order payments (if linked)
              const { data: payments } = await supabase
                .from('payments')
                .select('status, amount')
                .eq('reseller_id', resellerId)
                .eq('order_id', order.id)

              if (payments && payments.length > 0) {
                const totalPaid = payments
                  .filter(p => p.status === 'received')
                  .reduce((sum, p) => sum + Number(p.amount || 0), 0)
                const orderTotal = Number(order.total_price || 0)
                
                if (totalPaid >= orderTotal) {
                  paymentStatus = 'paid'
                } else if (totalPaid > 0) {
                  paymentStatus = 'partial'
                }
              }
            }

            return { ...order, payment_status: paymentStatus }
          })
        )
        setOrders(ordersWithPayments)
      }
      setLoading(false)
    }

    fetchOrders()
  }, [targetId, resellerId, targetCreatedAt, targetDeadline])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    in_making: 'bg-purple-100 text-purple-700',
    dispatched: 'bg-cyan-100 text-cyan-700',
    delivered: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Target Orders History</h2>
        <span className="text-sm text-slate-600">{orders.length} orders</span>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm">No orders placed within target period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <div key={order.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.order_code}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      statusColors[order.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-semibold text-slate-900 ml-1">
                    {formatCurrency(order.total_price)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Weight:</span>
                  <span className="font-semibold text-slate-900 ml-1">
                    {order.total_weight_kg.toFixed(2)} kg
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Payment:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : order.payment_status === 'partial'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'partial' ? 'Partial' : 'Unpaid'}
                  </span>
                </div>
                {order.status === 'delivered' && order.payment_status === 'unpaid' && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-orange-600" />
                    <span className="text-xs text-orange-600">Payment Due</span>
                  </div>
                )}
              </div>

              {/* Qualification Note */}
              {order.status === 'delivered' && order.payment_status === 'paid' && (
                <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  ✓ Qualified - Counts toward target
                </div>
              )}
              {order.status === 'delivered' && order.payment_status === 'partial' && (
                <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                  ⚠ Partial payment - Does not count yet
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
