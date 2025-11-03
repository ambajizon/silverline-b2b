'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { recordPayment, getResellersForFilter } from '@/app/(admin)/admin/payments/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

const paymentSchema = z.object({
  reseller_id: z.string().min(1, 'Reseller is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  payment_method: z.string().optional(),
  transaction_id: z.string().optional(),
  note: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface RecordPaymentModalProps {
  orderId?: string
  resellerId?: string
  resellerName?: string
  orderNumber?: string
  amountDue?: number
  onClose: () => void
}

export default function RecordPaymentModal({
  orderId: initialOrderId,
  resellerId: initialResellerId,
  resellerName,
  orderNumber,
  amountDue: initialAmountDue,
  onClose,
}: RecordPaymentModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resellers, setResellers] = useState<Array<{ id: string; shop_name: string }>>([])
  const [outstandingAmount, setOutstandingAmount] = useState<number>(initialAmountDue || 0)
  const [fetchingOutstanding, setFetchingOutstanding] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      reseller_id: initialResellerId || '',
      amount: 0,
      payment_method: 'cash',
      transaction_id: '',
      note: '',
    },
  })

  const selectedResellerId = watch('reseller_id')
  const enteredAmount = watch('amount')

  // Fetch resellers on mount
  useEffect(() => {
    const fetchResellers = async () => {
      const result = await getResellersForFilter()
      if (result.ok) setResellers(result.data)
    }
    fetchResellers()
  }, [])

  // Fetch outstanding amount when reseller changes
  useEffect(() => {
    const fetchOutstanding = async () => {
      if (!selectedResellerId) {
        setOutstandingAmount(0)
        return
      }

      setFetchingOutstanding(true)
      const supabase = supabaseBrowser()
      const { data } = await supabase
        .from('v_reseller_outstanding')
        .select('outstanding')
        .eq('reseller_id', selectedResellerId)
        .maybeSingle()

      const outstanding = Number(data?.outstanding || 0)
      setOutstandingAmount(outstanding)
      setFetchingOutstanding(false)
    }

    fetchOutstanding()
  }, [selectedResellerId])

  // Validate amount doesn't exceed outstanding
  useEffect(() => {
    if (enteredAmount && outstandingAmount > 0 && enteredAmount > outstandingAmount) {
      setError('amount', {
        type: 'manual',
        message: `Amount cannot exceed outstanding balance of ₹${outstandingAmount.toLocaleString()}`,
      })
    } else {
      clearErrors('amount')
    }
  }, [enteredAmount, outstandingAmount, setError, clearErrors])

  const onSubmit = async (data: PaymentFormData) => {
    // Final validation before submit
    if (outstandingAmount > 0 && data.amount > outstandingAmount) {
      toast.error(`Amount cannot exceed outstanding balance of ₹${outstandingAmount.toLocaleString()}`)
      return
    }

    setLoading(true)

    const result = await recordPayment({
      reseller_id: data.reseller_id,
      amount: data.amount,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Record Payment</h2>
            {resellerName && (
              <p className="text-sm text-slate-600 mt-1">
                {resellerName} - {orderNumber}
              </p>
            )}
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
          {/* Reseller Selection (if not pre-selected) */}
          {!initialResellerId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reseller <span className="text-red-500">*</span>
              </label>
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
              {errors.reseller_id && <p className="text-red-500 text-xs mt-1">{errors.reseller_id.message}</p>}
            </div>
          )}


          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            {outstandingAmount > 0 && (
              <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-semibold text-blue-900">
                  Outstanding Balance: ₹{outstandingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You can record payment up to this amount only
                </p>
              </div>
            )}
            {fetchingOutstanding && (
              <p className="text-xs text-slate-500 mb-2">Fetching outstanding amount...</p>
            )}
            <input
              type="number"
              step="0.01"
              max={outstandingAmount > 0 ? outstandingAmount : undefined}
              {...register('amount', { valueAsNumber: true })}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              {...register('payment_method')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID</label>
            <input
              type="text"
              {...register('transaction_id')}
              placeholder="e.g., UPI ID, Cheque number"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <textarea
              {...register('note')}
              rows={3}
              placeholder="Add any additional notes (optional)"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
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
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
