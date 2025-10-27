'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/app/(admin)/admin/orders/actions'
import { OrderStatus } from '@/types/orders'

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus: OrderStatus
  currentNotes: string | null
}

export default function OrderStatusUpdate({ orderId, currentStatus, currentNotes }: OrderStatusUpdateProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [notes, setNotes] = useState(currentNotes || '')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    const result = await updateOrderStatus(orderId, status, notes)
    setLoading(false)

    if (result.success) {
      alert('Order status updated successfully')
      window.location.reload()
    } else {
      alert(result.error || 'Failed to update order status')
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Update Order Status</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_making">In Making</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Add a note for the customer..."
          />
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </div>
  )
}
