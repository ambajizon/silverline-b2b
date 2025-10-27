'use client'

import { ShieldCheck, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { maskGstNumber, maskPanNumber, maskAadharNumber } from '@/lib/validations/tax-info'

interface ResellerTaxInfoProps {
  reseller: {
    has_gst?: boolean | null
    gst_number?: string | null
    pan_number?: string | null
    aadhar_number?: string | null
    business_name?: string | null
    pan_holder_type?: string | null
    state_code?: string | null
    tax_info_verified?: boolean | null
    tax_info_submitted_at?: string | null
    tax_info_update_count?: number | null
  }
}

export default function ResellerTaxInfo({ reseller }: ResellerTaxInfoProps) {
  const hasSubmitted = !!reseller.tax_info_submitted_at
  const isVerified = reseller.tax_info_verified ?? false
  const updateCount = reseller.tax_info_update_count ?? 0

  if (!hasSubmitted) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-50 rounded-lg p-2">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tax Information</h2>
            <p className="text-sm text-slate-600 mt-1">GST, PAN, and Aadhar details</p>
          </div>
        </div>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No tax information submitted yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 p-4">
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
          
          {isVerified ? (
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Pending Verification</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 text-sm">
          <div>
            <span className="text-slate-500">Submitted:</span>{' '}
            <span className="font-medium text-slate-900">
              {new Date(reseller.tax_info_submitted_at!).toLocaleDateString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Updates:</span>{' '}
            <span className="font-medium text-slate-900">{updateCount}</span>
          </div>
        </div>
      </div>

      {/* Tax Details */}
      <div className="p-6 space-y-4">
        {/* Registration Type */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Registration Type
          </label>
          <div className="mt-1 flex items-center gap-2">
            {reseller.has_gst ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-900">GST Registered</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-900">PAN Only</span>
              </>
            )}
          </div>
        </div>

        {/* GST Number (if has GST) */}
        {reseller.has_gst && reseller.gst_number && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                GST Number
              </label>
              <p className="mt-1 text-sm font-mono text-slate-900 bg-slate-50 rounded px-3 py-2 border border-slate-200">
                {reseller.gst_number}
              </p>
            </div>
            {reseller.state_code && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  State Code
                </label>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {reseller.state_code}
                </p>
              </div>
            )}
          </>
        )}

        {/* PAN Number (if no GST) */}
        {!reseller.has_gst && reseller.pan_number && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              PAN Number
            </label>
            <p className="mt-1 text-sm font-mono text-slate-900 bg-slate-50 rounded px-3 py-2 border border-slate-200">
              {reseller.pan_number}
            </p>
          </div>
        )}

        {/* Business/Person Name */}
        {reseller.business_name && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {reseller.has_gst ? 'Business Name' : 'Name as per PAN'}
            </label>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {reseller.business_name}
            </p>
          </div>
        )}

        {/* PAN Holder Type (if no GST) */}
        {!reseller.has_gst && reseller.pan_holder_type && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              PAN Holder Type
            </label>
            <p className="mt-1 text-sm text-slate-900 capitalize">
              {reseller.pan_holder_type.replace('_', ' ')}
            </p>
          </div>
        )}

        {/* Aadhar Number (if provided) */}
        {reseller.aadhar_number && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Aadhar Number
            </label>
            <p className="mt-1 text-sm font-mono text-slate-900 bg-slate-50 rounded px-3 py-2 border border-slate-200">
              {maskAadharNumber(reseller.aadhar_number)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Partially masked for security</p>
          </div>
        )}
      </div>
    </div>
  )
}
