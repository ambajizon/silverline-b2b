'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { gstConfigSchema } from '@/lib/validations/settings'
import { upsertSettings } from '@/app/(admin)/admin/settings/actions'
import { z } from 'zod'

type GstConfigInput = z.infer<typeof gstConfigSchema>

interface GstConfigTabProps {
  settings: Record<string, string>
}

export default function GstConfigTab({ settings }: GstConfigTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const currentGstRate = parseFloat(settings.gst_rate || '0')
  const currentGstNumber = settings.company_gst_number || ''
  const currentStateCode = settings.company_state_code || ''

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GstConfigInput>({
    resolver: zodResolver(gstConfigSchema),
    defaultValues: {
      gst_enabled: currentGstRate > 0,
      gst_rate: currentGstRate > 0 ? currentGstRate : 3,
      company_gst_number: currentGstNumber,
      company_state_code: currentStateCode,
    },
  })

  const gstEnabled = watch('gst_enabled')
  const companyGstNumber = watch('company_gst_number')

  useEffect(() => {
    reset({
      gst_enabled: currentGstRate > 0,
      gst_rate: currentGstRate > 0 ? currentGstRate : 3,
      company_gst_number: currentGstNumber,
      company_state_code: currentStateCode,
    })
  }, [settings, currentGstRate, currentGstNumber, currentStateCode, reset])

  // Set default rate when enabling GST
  useEffect(() => {
    if (gstEnabled && watch('gst_rate') === 0) {
      setValue('gst_rate', 3)
    }
  }, [gstEnabled, watch, setValue])

  const onSubmit = async (data: GstConfigInput) => {
    setLoading(true)

    try {
      // Ensure rate is a valid number
      const gstRateValue = data.gst_enabled ? Number(data.gst_rate).toString() : '0'
      
      console.log('💾 Saving GST config:', { gst_enabled: data.gst_enabled, gst_rate: gstRateValue })

      // Extract state code from GST number if provided
      let stateCode = data.company_state_code || ''
      if (data.company_gst_number && data.company_gst_number.trim().length >= 2) {
        stateCode = data.company_gst_number.trim().substring(0, 2)
      }

      const result = await upsertSettings({
        gst_rate: gstRateValue,
        company_gst_number: data.company_gst_number?.trim().toUpperCase() || '',
        company_state_code: stateCode,
      })

      if (result.ok) {
        toast.success('GST configuration updated successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update GST settings')
      }
    } catch (error) {
      console.error('GST save error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">GST Configuration</h2>
        <p className="text-sm text-slate-600 mt-1">Configure GST settings for your business</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Current Status */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Current Status:</strong> GST is {currentGstRate > 0 ? `ENABLED at ${currentGstRate}%` : 'DISABLED'}
          </p>
        </div>

        {/* GST Enabled Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="font-medium text-slate-900">GST Enabled</p>
            <p className="text-sm text-slate-600">Enable GST for all transactions</p>
          </div>
          <Controller
            name="gst_enabled"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  field.value ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    field.value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
          />
        </div>

        {/* GST Rate */}
        {gstEnabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                GST Rate (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.01"
                  {...register('gst_rate', { valueAsNumber: true })}
                  placeholder="Enter GST rate"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              {errors.gst_rate && (
                <p className="text-red-500 text-xs mt-1">{errors.gst_rate.message}</p>
              )}
            </div>

            {/* Company GST Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company GST Number <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                {...register('company_gst_number')}
                placeholder="e.g., 27AAAAA0000A1Z5"
                maxLength={15}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
              />
              {errors.company_gst_number && (
                <p className="text-red-500 text-xs mt-1">{errors.company_gst_number.message}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                15-character GST number. State code will be auto-extracted for CGST/SGST/IGST calculation.
              </p>
            </div>

            {/* State Code (Auto-filled) */}
            {companyGstNumber && companyGstNumber.length >= 2 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>State Code:</strong> {companyGstNumber.substring(0, 2)}
                </p>
              </div>
            )}
          </>
        )}

        {/* Helper Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This GST rate affects pricing across all Orders and Invoices. Changes will apply to new transactions immediately.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-medium"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
