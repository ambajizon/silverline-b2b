'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, Loader2 } from 'lucide-react'

const financialSchema = z.object({
  credit_limit: z.number().min(0, 'Must be 0 or greater').nullable(),
  discount_percentage: z.number().min(0, 'Must be 0 or greater').max(100, 'Cannot exceed 100%').nullable(),
  extra_charges_percentage: z.number().min(0, 'Must be 0 or greater').max(100, 'Cannot exceed 100%').nullable(),
  payment_terms: z.string().min(1, 'Payment terms required'),
})

type FinancialForm = z.infer<typeof financialSchema>

interface EditFinancialModalProps {
  resellerId: string
  currentData: {
    credit_limit: number | null
    discount_percentage: number | null
    extra_charges_percentage: number | null
    payment_terms: string | null
  }
  onClose: () => void
}

export default function EditFinancialModal({ resellerId, currentData, onClose }: EditFinancialModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FinancialForm>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      credit_limit: currentData.credit_limit || 0,
      discount_percentage: currentData.discount_percentage || 0,
      extra_charges_percentage: currentData.extra_charges_percentage || 0,
      payment_terms: currentData.payment_terms || 'Net 30',
    },
  })

  const onSubmit = async (data: FinancialForm) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/admin/api/resellers/update-financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reseller_id: resellerId, ...data }),
      })

      const result = await res.json()

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to update financial details')
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update financial details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Edit Financial Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Credit Limit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Credit Limit (₹)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('credit_limit', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="0"
            />
            {errors.credit_limit && (
              <p className="mt-1 text-sm text-red-600">{errors.credit_limit.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Maximum credit amount allowed for this reseller
            </p>
          </div>

          {/* Discount Percentage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              step="0.01"
              max="100"
              {...register('discount_percentage', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="0"
            />
            {errors.discount_percentage && (
              <p className="mt-1 text-sm text-red-600">{errors.discount_percentage.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Discount percentage applied to all orders
            </p>
          </div>

          {/* Global Loop Percentage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Global Loop (%)
            </label>
            <input
              type="number"
              step="0.01"
              max="100"
              {...register('extra_charges_percentage', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="0"
            />
            {errors.extra_charges_percentage && (
              <p className="mt-1 text-sm text-red-600">{errors.extra_charges_percentage.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Global loop percentage applied to all orders
            </p>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Terms <span className="text-red-500">*</span>
            </label>
            <select
              {...register('payment_terms')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="Net 7">Net 7 Days</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 45">Net 45 Days</option>
              <option value="Net 60">Net 60 Days</option>
              <option value="Immediate">Immediate Payment</option>
              <option value="Custom">Custom Terms</option>
            </select>
            {errors.payment_terms && (
              <p className="mt-1 text-sm text-red-600">{errors.payment_terms.message}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
