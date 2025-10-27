'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { createTarget } from '@/app/(admin)/admin/targets/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

const targetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['purchase_value', 'weight', 'order_count', 'category_specific', 'revenue']),
  goal: z.number().positive('Goal must be greater than 0'),
  deadline: z.string().min(1, 'Deadline is required'),
  terms: z.string().optional(),
  notes: z.string().optional(),
  reward_type: z.enum(['cashback', 'gift', 'discount']).optional(),
  reward_value: z.number().positive().optional(),
  reseller_id: z.string().optional(),
  open_participation: z.boolean().optional(),
})

type TargetFormData = z.infer<typeof targetSchema>

interface CreateTargetModalProps {
  onClose: () => void
}

export default function CreateTargetModal({ onClose }: CreateTargetModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resellers, setResellers] = useState<Array<{ id: string; shop_name: string }>>([])
  const [enableTargetFeatures, setEnableTargetFeatures] = useState(true)
  const [sendNotification, setSendNotification] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      name: '',
      type: 'purchase_value',
      goal: 0,
      deadline: '',
      terms: '',
      notes: '',
      reward_type: 'cashback',
      reward_value: 0,
      reseller_id: '',
      open_participation: false,
    },
  })

  const openParticipation = watch('open_participation')

  useEffect(() => {
    const fetchResellers = async () => {
      const supabase = supabaseBrowser()
      const { data } = await supabase
        .from('resellers')
        .select('id, shop_name')
        .eq('status', 'approved')
        .order('shop_name')

      if (data) setResellers(data)
    }
    fetchResellers()
  }, [])

  const onSubmit = async (data: TargetFormData) => {
    // Validate future deadline
    const deadlineDate = new Date(data.deadline)
    if (deadlineDate <= new Date()) {
      toast.error('Deadline must be in the future')
      return
    }

    setLoading(true)

    const result = await createTarget({
      ...data,
      reseller_id: data.open_participation ? null : (data.reseller_id || null),
      open_participation: data.open_participation || false,
    })

    setLoading(false)

    if (result.ok) {
      toast.success('Target created successfully')
      
      // Send notification if enabled
      if (sendNotification && result.data?.id) {
        // Insert notification (simplified - you can expand this)
        const supabase = supabaseBrowser()
        await supabase.from('notifications').insert({
          user_id: data.reseller_id || null,
          type: 'target_created',
          title: 'New Target Created',
          message: `A new target "${data.name}" has been created.`,
          related_id: result.data.id,
        })
      }

      router.refresh()
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full my-8">
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Target Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Target Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  placeholder="e.g., Q1 Sales Sprint"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="purchase_value">Purchase Value</option>
                  <option value="weight">Weight</option>
                  <option value="order_count">Order Count</option>
                  <option value="category_specific">Category Specific</option>
                  <option value="revenue">Revenue</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Goal <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('goal', { valueAsNumber: true })}
                  placeholder="₹ 0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.goal && <p className="text-red-500 text-xs mt-1">{errors.goal.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('deadline')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
              </div>
            </div>
          </div>

          {/* Reseller Selection */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Reseller Selection</h3>
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                {...register('open_participation')}
                id="open_participation"
                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-slate-300 rounded"
              />
              <label htmlFor="open_participation" className="text-sm text-slate-700">
                Publish for Open Participation
              </label>
            </div>

            {!openParticipation && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enable Only for</label>
                <select
                  {...register('reseller_id')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Reseller</option>
                  {resellers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.shop_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reward & Qualification */}
          <div>
            <h3 className="text-sm font-semibold text-orange-600 mb-3">Reward & Qualification</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reward</label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  {...register('reward_type')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="cashback">Cashback</option>
                  <option value="gift">Gift</option>
                  <option value="discount">Discount</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  {...register('reward_value', { valueAsNumber: true })}
                  placeholder="₹ 0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {errors.reward_value && <p className="text-red-500 text-xs mt-1">{errors.reward_value.message}</p>}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="e.g., Qualification logic: resellers goal met + all bills paid (no dues)"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Terms</label>
              <textarea
                {...register('terms')}
                rows={3}
                placeholder="Details for reseller discussion..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Enable Target Features */}
          <div className="flex items-center justify-between py-3 border-t border-slate-200">
            <span className="text-sm font-medium text-slate-700">Enable Target Features</span>
            <button
              type="button"
              onClick={() => setEnableTargetFeatures(!enableTargetFeatures)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enableTargetFeatures ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableTargetFeatures ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Send Notification */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              id="send_notification"
              className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-slate-300 rounded"
            />
            <label htmlFor="send_notification" className="text-sm text-slate-700">
              Send Notification
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
