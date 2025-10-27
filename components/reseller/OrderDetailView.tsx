'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Download, Printer, Package } from 'lucide-react'
import { OrderDetail } from '@/types/reseller'
import { addToCart } from '@/lib/cart'
import { useRouter } from 'next/navigation'
import { toPublicUrl } from '@/lib/images'

interface OrderDetailViewProps {
  order: OrderDetail
}

const statusColors = {
  pending: 'bg-slate-50 text-slate-700 border-slate-200',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  in_making: 'bg-amber-50 text-amber-700 border-amber-200',
  dispatched: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
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

export default function OrderDetailView({ order }: OrderDetailViewProps) {
  const router = useRouter()

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleReorder = () => {
    // Add all items to cart
    order.items.forEach(item => {
      addToCart({
        productId: item.product_id,
        name: item.product_name,
        image: item.product_image,
        weightKg: item.weight_kg * item.quantity,
        price: item.line_total,
        total: item.line_total,
        tunch: item.tunch_percentage,
        labor: item.labor_per_kg,
        offer: 0,
      })
    })
    
    router.push('/reseller/cart')
  }

  const handlePrint = () => {
    router.push(`/reseller/orders/${order.id}/invoice`)
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link
        href="/reseller/orders"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order Summary */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Order #{order.order_number}</h1>
            <p className="text-xs text-slate-500">
              {new Date(order.created_at).toLocaleDateString('en-IN', { 
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium border ${
              statusColors[order.status as keyof typeof statusColors] ?? statusColors.pending
            }`}
          >
            {statusLabels[order.status as keyof typeof statusLabels] ?? 'Pending'}
          </span>
        </div>

        {/* Order Pipeline */}
        <div className="mb-4 pb-4 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-600 mb-3">Order Status</h3>
          <div className="relative">
            <div className="flex items-center justify-between">
              {/* Pending */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  ['pending', 'accepted', 'in_making', 'dispatched', 'delivered'].includes(order.status)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  1
                </div>
                <span className="text-[10px] mt-1 text-center text-slate-600">Pending</span>
              </div>

              {/* Accepted */}
              <div className="flex-1 h-0.5 bg-slate-200 -mt-4">
                <div className={`h-full ${
                  ['accepted', 'in_making', 'dispatched', 'delivered'].includes(order.status)
                    ? 'bg-blue-600'
                    : 'bg-slate-200'
                }`}></div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  ['accepted', 'in_making', 'dispatched', 'delivered'].includes(order.status)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  2
                </div>
                <span className="text-[10px] mt-1 text-center text-slate-600">Accepted</span>
              </div>

              {/* In Making */}
              <div className="flex-1 h-0.5 bg-slate-200 -mt-4">
                <div className={`h-full ${
                  ['in_making', 'dispatched', 'delivered'].includes(order.status)
                    ? 'bg-blue-600'
                    : 'bg-slate-200'
                }`}></div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  ['in_making', 'dispatched', 'delivered'].includes(order.status)
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  3
                </div>
                <span className="text-[10px] mt-1 text-center text-slate-600">Making</span>
              </div>

              {/* Dispatched */}
              <div className="flex-1 h-0.5 bg-slate-200 -mt-4">
                <div className={`h-full ${
                  ['dispatched', 'delivered'].includes(order.status)
                    ? 'bg-cyan-600'
                    : 'bg-slate-200'
                }`}></div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  ['dispatched', 'delivered'].includes(order.status)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  4
                </div>
                <span className="text-[10px] mt-1 text-center text-slate-600">Shipped</span>
              </div>

              {/* Delivered */}
              <div className="flex-1 h-0.5 bg-slate-200 -mt-4">
                <div className={`h-full ${
                  order.status === 'delivered'
                    ? 'bg-green-600'
                    : 'bg-slate-200'
                }`}></div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  order.status === 'delivered'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  5
                </div>
                <span className="text-[10px] mt-1 text-center text-slate-600">Delivered</span>
              </div>
            </div>

            {/* Cancelled/Rejected Status */}
            {(order.status === 'cancelled' || order.status === 'rejected') && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
                <span className="text-xs font-semibold text-red-700">
                  Order {statusLabels[order.status as keyof typeof statusLabels]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Total Weight</p>
            <p className="font-medium text-slate-900">{order.total_weight.toFixed(3)}kg ({order.total_weight * 1000}g)</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Total Amount</p>
            <p className="font-bold text-blue-600">{formatINR(order.total_amount)}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Items ({order.items.length})</h2>
        
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0">
              <div className="w-16 h-16 rounded bg-slate-100 flex-shrink-0 relative overflow-hidden">
                {item.product_image ? (
                  <Image src={toPublicUrl(item.product_image)} alt={item.product_name} fill className="object-cover" sizes="64px" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-900 mb-1">{item.product_name}</h3>
                <p className="text-xs text-slate-500 mb-1">
                  {item.weight_kg}kg × {item.quantity} = {(item.weight_kg * item.quantity).toFixed(3)}kg
                </p>
                <p className="text-sm font-semibold text-blue-600">{formatINR(item.line_total)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      {order.notes && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Shipping Address</h2>
          
          <div className="text-sm text-slate-700 whitespace-pre-wrap">
            {order.notes}
          </div>
        </div>
      )}

      {/* Tracking Information */}
      {(order.tracking_number || order.delivery_partner) && (
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Tracking Information</h2>
          
          <div className="space-y-2 text-sm">
            {order.delivery_partner && (
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Partner</span>
                <span className="font-medium text-slate-900">{order.delivery_partner}</span>
              </div>
            )}
            {order.tracking_number && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking Number</span>
                <span className="font-medium text-slate-900 font-mono text-xs">{order.tracking_number}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
