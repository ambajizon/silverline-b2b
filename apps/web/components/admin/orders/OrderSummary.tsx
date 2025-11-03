'use client'

import { useState } from 'react'
import { OrderItem } from '@/types/orders'
import { formatCurrency, formatWeight } from '@/lib/pricing'
import { updateOrderStatus } from '@/app/(admin)/admin/orders/actions'
import { useRouter } from 'next/navigation'

interface OrderSummaryProps {
  order: any
  items: OrderItem[]
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

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_making', label: 'In Making' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrderSummary({ order, items }: OrderSummaryProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(order.status)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return
    
    setUpdating(true)
    const result = await updateOrderStatus(order.id, newStatus as any)
    
    if (result.success) {
      setCurrentStatus(newStatus)
      router.refresh()
    } else {
      alert(result.error || 'Failed to update status')
    }
    setUpdating(false)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[currentStatus] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {currentStatus.replace('_', ' ')}
          </span>
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-xs text-slate-600 mb-1">Items Count</p>
          <p className="text-2xl font-bold text-slate-900">{items.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(order.total_price)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Total Weight</p>
          <p className="text-2xl font-bold text-slate-900">{formatWeight(order.total_weight_kg)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Placed By</p>
          <p className="text-sm font-medium text-slate-900">{order.reseller_name}</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Placed On</p>
            <p className="font-medium text-slate-900">
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          {order.tracking_number && (
            <div>
              <p className="text-slate-600">Tracking Number</p>
              <p className="font-medium text-slate-900">{order.tracking_number}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
