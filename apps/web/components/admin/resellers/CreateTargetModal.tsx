'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { createTarget } from '@/app/(admin)/admin/resellers/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(1, 'Type is required'),
  goal: z.number().positive('Goal must be greater than 0'),
  deadline: z.string().min(1, 'Deadline is required'),
  reward_type: z.enum(['percentage', 'fixed']),
  reward_value: z.number().positive('Reward value must be greater than 0'),
})

type TargetFormData = z.infer<typeof targetSchema>

interface CreateTargetModalProps {
  resellerId: string
  onClose: () => void
}

export default function CreateTargetModal({ resellerId, onClose }: CreateTargetModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      name: '',
      type: 'sales',
      goal: 0,
      deadline: '',
      reward_type: 'percentage',
      reward_value: 0,
    },
  })

  const onSubmit = async (data: TargetFormData) => {
    setLoading(true)

    const result = await createTarget({
      reseller_id: resellerId,
      name: data.name,
      type: data.type,
      goal: data.goal,
      deadline: data.deadline,
      reward_type: data.reward_type,
      reward_value: data.reward_value,
    })

    setLoading(false)

    if (result.ok) {
      toast.success('Target created successfully')
      router.refresh()
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create New Target</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g., Q1 Sales Target"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="sales">Sales</option>
              <option value="orders">Orders</option>
              <option value="revenue">Revenue</option>
              <option value="new_products">New Products</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Goal <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('goal', { valueAsNumber: true })}
              placeholder="e.g., 500000"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.goal && <p className="text-red-500 text-sm mt-1">{errors.goal.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('deadline')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reward Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('reward_type')}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reward Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('reward_value', { valueAsNumber: true })}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.reward_value && <p className="text-red-500 text-sm mt-1">{errors.reward_value.message}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
