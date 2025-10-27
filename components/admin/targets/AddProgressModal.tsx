'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { recordTargetProgress } from '@/app/(admin)/admin/targets/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const progressSchema = z.object({
  delta_value: z.number().min(0.01, 'Value must be greater than 0'),
  note: z.string().optional(),
})

type ProgressFormData = z.infer<typeof progressSchema>

interface AddProgressModalProps {
  targetId: string
  targetName: string
  onClose: () => void
}

export default function AddProgressModal({ targetId, targetName, onClose }: AddProgressModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      delta_value: 0,
      note: '',
    },
  })

  const onSubmit = async (data: ProgressFormData) => {
    setLoading(true)

    const result = await recordTargetProgress(targetId, data.delta_value, data.note)

    setLoading(false)

    if (result.ok) {
      toast.success('Progress recorded successfully')
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
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Add Progress</h2>
            <p className="text-sm text-slate-600 mt-1">{targetName}</p>
          </div>
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
              Progress Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('delta_value', { valueAsNumber: true })}
              placeholder="Enter value achieved"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.delta_value && <p className="text-red-500 text-sm mt-1">{errors.delta_value.message}</p>}
            <p className="text-xs text-slate-500 mt-1">
              This will be added to the current progress
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <textarea
              {...register('note')}
              rows={3}
              placeholder="Add a note about this progress update (optional)"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
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
              {loading ? 'Recording...' : 'Record Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
