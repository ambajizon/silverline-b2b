'use client'

import { useState } from 'react'
import { CheckCircle, Truck, X } from 'lucide-react'
import { approveReward, markRewardDelivered } from '@/app/(admin)/admin/rewards/actions'

interface Reward {
  claim_id: string
  reward_name: string
  reward_type: string
  cash_amount: number
  item_value: number
  total_value: number
  reseller_shop: string
  reseller_contact: string
  reseller_phone: string
  target_name: string | null
  status: string
  claimed_date: string
  approved_date: string | null
  delivered_date: string | null
  delivery_method: string | null
  tracking_number: string | null
  days_since_claimed: number
  status_display: string
}

export default function RewardsTable({ rewards }: { rewards: Reward[] }) {
  const [loading, setLoading] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleApprove = async (claimId: string) => {
    if (!confirm('Approve this reward claim?')) return
    
    setLoading(claimId)
    const result = await approveReward(claimId)
    setLoading(null)

    if (result.ok) {
      alert('Reward approved successfully!')
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const handleMarkDelivered = async (claimId: string) => {
    const trackingNumber = prompt('Enter tracking number (optional):')
    const deliveryNotes = prompt('Enter delivery notes (optional):')
    
    setLoading(claimId)
    const result = await markRewardDelivered(claimId, trackingNumber || undefined, deliveryNotes || undefined)
    setLoading(null)

    if (result.ok) {
      alert('Reward marked as delivered!')
      window.location.reload()
    } else {
      alert('Error: ' + result.error)
    }
  }

  if (rewards.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-600">No rewards claimed yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Reward</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Reseller</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Target</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Value</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-700">Status</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-700">Days</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rewards.map((reward) => (
            <tr key={reward.claim_id} className="hover:bg-slate-50">
              <td className="py-3 px-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{reward.reward_name}</p>
                  <p className="text-xs text-slate-600 capitalize">{reward.reward_type}</p>
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{reward.reseller_shop}</p>
                  <p className="text-xs text-slate-600">{reward.reseller_contact}</p>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">
                {reward.target_name || 'Manual Entry'}
              </td>
              <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900">
                {formatCurrency(reward.total_value)}
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    reward.status === 'pending'
                      ? 'bg-orange-100 text-orange-700'
                      : reward.status === 'approved'
                      ? 'bg-blue-100 text-blue-700'
                      : reward.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {reward.status_display}
                </span>
              </td>
              <td className="py-3 px-4 text-center text-sm text-slate-600">
                {reward.days_since_claimed}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  {reward.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(reward.claim_id)}
                      disabled={loading === reward.claim_id}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Approve
                    </button>
                  )}
                  {reward.status === 'approved' && (
                    <button
                      onClick={() => handleMarkDelivered(reward.claim_id)}
                      disabled={loading === reward.claim_id}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <Truck className="h-3 w-3" />
                      Delivered
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
