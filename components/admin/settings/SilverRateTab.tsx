'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { SilverRate } from '@/types/settings'
import { silverRateSchema } from '@/lib/validations/settings'
import { updateSilverRate } from '@/app/(admin)/admin/settings/actions'

interface SilverRateTabProps {
  currentRate: number
  rateHistory: SilverRate[]
}

export default function SilverRateTab({ currentRate, rateHistory }: SilverRateTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(silverRateSchema),
    defaultValues: {
      per10g: 0,
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)

    const result = await updateSilverRate(data.per10g)

    if (result.ok) {
      toast.success('Silver rate updated successfully')
      reset()
      router.refresh()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return `${Math.floor(diffMins / 1440)} days ago`
  }

  const latestUpdate = rateHistory[0]?.created_at

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Silver Rate Management</h2>
      {latestUpdate && (
        <p className="text-sm text-slate-600">Last updated: {getTimeAgo(latestUpdate)}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card - Current Rate & Update Form */}
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="mb-6">
            <p className="text-sm text-slate-600 mb-2">Current Rate</p>
            <p className="text-4xl font-bold text-yellow-600">
              {formatCurrency(currentRate * 10)}
            </p>
            <p className="text-xs text-slate-500 mt-1">per 10g</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Rate (per 10g)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('per10g', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {errors.per10g && (
                <p className="text-red-500 text-xs mt-1">{errors.per10g.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Updating...' : 'Update Rate'}
            </button>
          </form>
        </div>

        {/* Right Card - Rate History */}
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Rate History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-2 px-2 text-xs font-medium text-slate-700 uppercase">Date</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-700 uppercase">Rate</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-700 uppercase">Updated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rateHistory.map((rate) => (
                  <tr key={rate.id}>
                    <td className="py-2 px-2 text-xs text-slate-600">
                      {new Date(rate.created_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-2 text-xs text-slate-900 font-medium text-right">
                      {formatCurrency(rate.rate_per_gram * 10)}
                    </td>
                    <td className="py-2 px-2 text-xs text-slate-600 text-right">
                      {rate.updated_by_email || 'Admin User'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rateHistory.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No history available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
