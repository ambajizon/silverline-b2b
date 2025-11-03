'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { companyInfoSchema } from '@/lib/validations/settings'
import { upsertSettings } from '@/app/(admin)/admin/settings/actions'

interface CompanyInfoTabProps {
  settings: Record<string, string>
}

export default function CompanyInfoTab({ settings }: CompanyInfoTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      company_name: settings.company_name || '',
      company_address: settings.company_address || '',
      company_gstin: settings.company_gstin || '',
      company_phone: settings.company_phone || '',
    },
  })

  useEffect(() => {
    reset({
      company_name: settings.company_name || '',
      company_address: settings.company_address || '',
      company_gstin: settings.company_gstin || '',
      company_phone: settings.company_phone || '',
    })
  }, [settings, reset])

  const onSubmit = async (data: any) => {
    setLoading(true)

    const result = await upsertSettings(data)

    if (result.ok) {
      toast.success('Company information updated successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
        <p className="text-sm text-slate-600 mt-1">Manage your company details and contact information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('company_name')}
            placeholder="Enter company name"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.company_name && (
            <p className="text-red-500 text-xs mt-1">{errors.company_name.message}</p>
          )}
        </div>

        {/* Company Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('company_address')}
            rows={3}
            placeholder="Enter company address"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.company_address && (
            <p className="text-red-500 text-xs mt-1">{errors.company_address.message}</p>
          )}
        </div>

        {/* GSTIN */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            GSTIN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('company_gstin')}
            placeholder="Enter 15-digit GSTIN"
            maxLength={15}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.company_gstin && (
            <p className="text-red-500 text-xs mt-1">{errors.company_gstin.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('company_phone')}
            placeholder="Enter phone number"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.company_phone && (
            <p className="text-red-500 text-xs mt-1">{errors.company_phone.message}</p>
          )}
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
