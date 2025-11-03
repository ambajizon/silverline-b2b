'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ShieldCheck, FileText, AlertCircle, History } from 'lucide-react'
import { taxInfoSchema, type TaxInfoInput } from '@/lib/validations/tax-info'
import { saveTaxInfo, getTaxUpdateHistory, type TaxInfo, type TaxUpdateHistory } from '@/app/(reseller)/reseller/account/actions'

interface TaxSettingsSectionProps {
  initialData: TaxInfo | null
}

export default function TaxSettingsSection({ initialData }: TaxSettingsSectionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<TaxUpdateHistory[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaxInfoInput>({
    resolver: zodResolver(taxInfoSchema),
    defaultValues: {
      has_gst: initialData?.has_gst ?? false,
      gst_number: initialData?.gst_number ?? '',
      pan_number: initialData?.pan_number ?? '',
      aadhar_number: initialData?.aadhar_number ?? '',
      business_name: initialData?.business_name ?? '',
      pan_holder_type: initialData?.pan_holder_type ?? 'individual',
      tax_info_accepted: false,
    },
  })

  const hasGst = watch('has_gst')
  const hasSubmitted = !!initialData?.tax_info_submitted_at
  const updateCount = initialData?.tax_info_update_count ?? 0
  const isVerified = initialData?.tax_info_verified ?? false

  const onSubmit = async (data: TaxInfoInput) => {
    setLoading(true)
    try {
      const result = await saveTaxInfo(data)
      
      if (result.success) {
        toast.success(hasSubmitted ? 'Tax information updated successfully' : 'Tax information saved successfully')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save tax information')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    const result = await getTaxUpdateHistory()
    if (result.success && result.data) {
      setHistory(result.data)
      setShowHistory(true)
    } else {
      toast.error('Failed to load update history')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tax Information</h2>
              <p className="text-sm text-slate-600 mt-0.5">GST, PAN, and Aadhar details</p>
            </div>
          </div>
          
          {isVerified && (
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Verified</span>
            </div>
          )}
        </div>

        {/* Status Info */}
        {hasSubmitted && (
          <div className="mt-4 flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Last updated:</span>{' '}
              {new Date(initialData?.tax_info_submitted_at!).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">Updates:</span> {updateCount} time{updateCount !== 1 ? 's' : ''}
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <History className="h-4 w-4" />
              View History
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Important</p>
            <p className="mt-1">Provide accurate tax information. This will be used for invoices and compliance. You can update this information later if needed.</p>
          </div>
        </div>

        {/* GST vs PAN Toggle */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <label className="block text-sm font-medium text-slate-900 mb-3">
            Tax Registration Type <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${!hasGst ? 'text-blue-600' : 'text-slate-500'}`}>
              PAN Only
            </span>
            <button
              type="button"
              onClick={() => setValue('has_gst', !hasGst)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                hasGst ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  hasGst ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${hasGst ? 'text-blue-600' : 'text-slate-500'}`}>
              GST Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {hasGst 
              ? 'You have GST registration - provide your GSTIN' 
              : 'You don\'t have GST - provide your PAN card details'}
          </p>
        </div>

        {/* GST Number (if has GST) */}
        {hasGst && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              GST Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('gst_number')}
              placeholder="e.g., 27AAAAA0000A1Z5"
              maxLength={15}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm uppercase"
            />
            {errors.gst_number && (
              <p className="text-red-500 text-xs mt-1.5">{errors.gst_number.message}</p>
            )}
            <p className="text-xs text-slate-500 mt-1.5">15-character GST registration number</p>
          </div>
        )}

        {/* PAN Number (if no GST) */}
        {!hasGst && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PAN Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('pan_number')}
              placeholder="e.g., ABCDE1234F"
              maxLength={10}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm uppercase"
            />
            {errors.pan_number && (
              <p className="text-red-500 text-xs mt-1.5">{errors.pan_number.message}</p>
            )}
            <p className="text-xs text-slate-500 mt-1.5">10-character PAN card number (mandatory if no GST)</p>
          </div>
        )}

        {/* Business/Person Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {hasGst ? 'Firm/Business Name' : 'Name as per PAN Card'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('business_name')}
            placeholder={hasGst ? 'e.g., ABC Jewellers' : 'e.g., Rajesh Kumar'}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          />
          {errors.business_name && (
            <p className="text-red-500 text-xs mt-1.5">{errors.business_name.message}</p>
          )}
        </div>

        {/* PAN Holder Type - Only show for PAN Only mode */}
        {!hasGst && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PAN Holder Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('pan_holder_type')}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            >
              <option value="individual">Individual</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership Firm</option>
              <option value="company">Company/LLP</option>
              <option value="trust">Trust</option>
              <option value="huf">HUF (Hindu Undivided Family)</option>
            </select>
            {errors.pan_holder_type && (
              <p className="text-red-500 text-xs mt-1.5">{errors.pan_holder_type.message}</p>
            )}
            <p className="text-xs text-slate-500 mt-1.5">Select the type of PAN card holder</p>
          </div>
        )}

        {/* Aadhar Number (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Aadhar Number <span className="text-slate-400">(Optional)</span>
          </label>
          <input
            type="text"
            {...register('aadhar_number')}
            placeholder="e.g., 1234 5678 9012"
            maxLength={14}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          />
          {errors.aadhar_number && (
            <p className="text-red-500 text-xs mt-1.5">{errors.aadhar_number.message}</p>
          )}
          <p className="text-xs text-slate-500 mt-1.5">12-digit Aadhar number (can include spaces)</p>
        </div>

        {/* Self Declaration */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('tax_info_accepted')}
              className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600 mt-0.5 flex-shrink-0"
            />
            <div className="text-sm">
              <p className="font-medium text-slate-900">Self Declaration</p>
              <p className="text-slate-600 mt-1">
                I hereby declare that the information provided above is true and correct to the best of my knowledge. 
                I understand that providing false information may lead to account suspension.
              </p>
            </div>
          </label>
          {errors.tax_info_accepted && (
            <p className="text-red-500 text-xs mt-2 ml-8">{errors.tax_info_accepted.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Saving...' : hasSubmitted ? 'Update Tax Information' : 'Save Tax Information'}
          </button>
        </div>
      </form>

      {/* Update History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Update History</h3>
              <p className="text-sm text-slate-600 mt-1">Track all changes to your tax information</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {history.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No update history available</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.update_type === 'initial_submission' ? 'bg-green-100 text-green-700' :
                          item.update_type === 'admin_correction' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.update_type === 'initial_submission' ? 'Initial Submission' :
                           item.update_type === 'admin_correction' ? 'Admin Correction' :
                           'Updated'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">GST:</span>{' '}
                          <span className="font-medium">{item.has_gst ? 'Yes' : 'No'}</span>
                        </div>
                        {item.gst_number && (
                          <div>
                            <span className="text-slate-500">GST Number:</span>{' '}
                            <span className="font-medium font-mono text-xs">{item.gst_number}</span>
                          </div>
                        )}
                        {item.pan_number && (
                          <div>
                            <span className="text-slate-500">PAN:</span>{' '}
                            <span className="font-medium font-mono text-xs">{item.pan_number}</span>
                          </div>
                        )}
                        {item.business_name && (
                          <div>
                            <span className="text-slate-500">Name:</span>{' '}
                            <span className="font-medium">{item.business_name}</span>
                          </div>
                        )}
                      </div>
                      
                      {item.admin_notes && (
                        <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-800">
                          <strong>Admin Note:</strong> {item.admin_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
