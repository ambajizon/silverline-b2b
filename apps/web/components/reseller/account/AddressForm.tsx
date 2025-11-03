'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { updateAddress } from '@/app/(reseller)/reseller/account/actions'

interface AddressFormProps {
  defaultAddress: string | null
}

export default function AddressForm({ defaultAddress }: AddressFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [address, setAddress] = useState(defaultAddress ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateAddress({ address })

    if (result.success) {
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error ?? 'Failed to update address')
    }

    setLoading(false)
  }

  const handleCancel = () => {
    setAddress(defaultAddress ?? '')
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Address</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-2">
            <MapPin className="h-3 w-3" />
            Business Address
          </label>
          <textarea
            disabled={!isEditing}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 resize-none"
            placeholder="Enter your complete business address"
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-xs text-green-700">Address updated successfully!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Edit Address
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
