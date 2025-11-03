'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { recordPayment } from '@/app/(admin)/admin/resellers/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  payment_mode: z.string().min(1, 'Payment mode is required'),
  reference: z.string().optional(),
  note: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface RecordPaymentModalProps {
  resellerId: string
  onClose: () => void
}

export default function RecordPaymentModal({ resellerId, onClose }: RecordPaymentModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_mode: 'cash',
      reference: '',
      note: '',
    },
  })

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true)

    const result = await recordPayment({
      reseller_id: resellerId,
      amount: data.amount,
      payment_mode: data.payment_mode,
      reference: data.reference,
      note: data.note,
    })

    setLoading(false)

    if (result.ok) {
      toast.success('Payment recorded successfully')
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
          <h2 className="text-xl font-semibold text-slate-900">Record Payment</h2>
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
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="e.g., 25,000"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
            <p className="text-xs text-slate-500 mt-1">Amount is required</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mode <span className="text-red-500">*</span>
            </label>
            <select
              {...register('payment_mode')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select Payment Mode</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
            {errors.payment_mode && <p className="text-red-500 text-sm mt-1">{errors.payment_mode.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
            <input
              {...register('reference')}
              placeholder="Transaction ID / Cheque No."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <textarea
              {...register('note')}
              rows={3}
              placeholder="Add any relevant note..."
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
              {loading ? 'Recording...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
