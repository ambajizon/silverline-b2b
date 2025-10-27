'use client'

import { ResellerWithProfile } from '@/types/resellers'
import { useState } from 'react'
import RecordPaymentModal from './RecordPaymentModal'
import EditFinancialModal from './EditFinancialModal'
import { formatCurrency } from '@/lib/pricing'
import { Edit } from 'lucide-react'

interface ResellerFinancialDetailsProps {
  reseller: ResellerWithProfile
}

export default function ResellerFinancialDetails({ reseller }: ResellerFinancialDetailsProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Financial Details</h2>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">Current Outstanding</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(reseller.current_outstanding || 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-600 mb-1">Credit Limit</p>
            <p className="text-lg font-semibold text-slate-900">
              {reseller.credit_limit ? formatCurrency(reseller.credit_limit) : 'Not Set'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-1">Discount (%)</p>
            <p className="text-lg font-semibold text-slate-900">
              {reseller.discount_percent ?? 'Not Set'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-1">Global Loop (%)</p>
            <p className="text-lg font-semibold text-slate-900">
              {reseller.extra_charges_percent ?? 'Not Set'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-1">Payment Terms</p>
            <p className="text-lg font-semibold text-slate-900">
              {reseller.payment_terms || 'Net 30'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Add Record Payment
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <RecordPaymentModal
          resellerId={reseller.id}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showEditModal && (
        <EditFinancialModal
          resellerId={reseller.id}
          currentData={{
            credit_limit: reseller.credit_limit ?? null,
            discount_percentage: reseller.discount_percent ?? null,
            extra_charges_percentage: reseller.extra_charges_percent ?? null,
            payment_terms: reseller.payment_terms ?? null,
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  )
}
