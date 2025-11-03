'use client'

import { useState } from 'react'
import { CheckCircle, Truck, Trophy } from 'lucide-react'
import { approveReward, markRewardDelivered } from '@/app/(admin)/admin/rewards/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface QualifiedReseller {
  target_id: string
  target_name: string
  reseller_id: string
  reseller_name: string
  reseller_email: string
  reseller_phone: string
  goal: number
  goal_display: string
  achieved: number
  achieved_display: string
  is_qualified: boolean
  reward_status: string
  reward_approved_date: string | null
  reward_delivered_date: string | null
  deadline: string
}

export default function QualifiedResellersTable({ qualified }: { qualified: QualifiedReseller[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = async (targetId: string, resellerName: string) => {
    if (!confirm(`Approve gift for ${resellerName}?`)) return
    
    setLoading(targetId)
    const result = await approveReward(targetId)
    setLoading(null)

    if (result.ok) {
      toast.success('Reward approved successfully!')
      router.refresh()
    } else {
      toast.error('Error: ' + result.error)
    }
  }

  const handleMarkDelivered = async (targetId: string, resellerName: string) => {
    if (!confirm(`Mark gift as delivered to ${resellerName}?`)) return
    
    setLoading(targetId)
    const result = await markRewardDelivered(targetId)
    setLoading(null)

    if (result.ok) {
      toast.success('Reward marked as delivered!')
      router.refresh()
    } else {
      toast.error('Error: ' + result.error)
    }
  }

  if (qualified.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-600">No qualified resellers yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Reseller</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Target</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-700">Goal</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-700">Achieved</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-slate-700">Status</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {qualified.map((item) => (
            <tr key={item.target_id} className="hover:bg-slate-50">
              <td className="py-3 px-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    {item.reseller_name}
                  </p>
                  <p className="text-xs text-slate-600">{item.reseller_email}</p>
                  {item.reseller_phone && (
                    <p className="text-xs text-slate-500">{item.reseller_phone}</p>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm font-medium text-slate-900">{item.target_name}</p>
                <p className="text-xs text-slate-600">
                  Deadline: {new Date(item.deadline).toLocaleDateString('en-IN')}
                </p>
              </td>
              <td className="py-3 px-4 text-center text-sm text-slate-600">
                {item.goal_display}
              </td>
              <td className="py-3 px-4 text-center text-sm font-semibold text-green-600">
                {item.achieved_display}
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    item.reward_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : item.reward_status === 'approved'
                      ? 'bg-blue-100 text-blue-700'
                      : item.reward_status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.reward_status === 'pending' && 'Pending Approval'}
                  {item.reward_status === 'approved' && 'Approved'}
                  {item.reward_status === 'delivered' && '✓ Delivered'}
                </span>
                {item.reward_approved_date && (
                  <p className="text-xs text-slate-500 mt-1">
                    Approved: {new Date(item.reward_approved_date).toLocaleDateString('en-IN')}
                  </p>
                )}
                {item.reward_delivered_date && (
                  <p className="text-xs text-slate-500 mt-1">
                    Delivered: {new Date(item.reward_delivered_date).toLocaleDateString('en-IN')}
                  </p>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  {item.reward_status === 'pending' && (
                    <button
                      onClick={() => handleApprove(item.target_id, item.reseller_name)}
                      disabled={loading === item.target_id}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Approve Gift
                    </button>
                  )}
                  {item.reward_status === 'approved' && (
                    <button
                      onClick={() => handleMarkDelivered(item.target_id, item.reseller_name)}
                      disabled={loading === item.target_id}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <Truck className="h-3 w-3" />
                      Mark Delivered
                    </button>
                  )}
                  {item.reward_status === 'delivered' && (
                    <span className="text-xs text-green-600 font-medium">✓ Complete</span>
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
