'use client'

import { useState } from 'react'
import { Mail, Phone, User, Key } from 'lucide-react'
import AvatarUploader from './AvatarUploader'
import ChangePasswordModal from './ChangePasswordModal'
import { updateProfile } from '@/app/(reseller)/reseller/account/actions'

interface ProfileCardProps {
  email: string
  shopName: string
  contactName: string | null
  phone: string | null
  logoUrl: string | null
}

export default function ProfileCard({ email, shopName, contactName, phone, logoUrl }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    shop_name: shopName,
    contact_name: contactName ?? '',
    phone: phone ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateProfile(formData)

    if (result.success) {
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error ?? 'Failed to update profile')
    }

    setLoading(false)
  }

  const handleCancel = () => {
    setFormData({
      shop_name: shopName,
      contact_name: contactName ?? '',
      phone: phone ?? '',
    })
    setIsEditing(false)
    setError(null)
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Profile Info</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
          <AvatarUploader currentUrl={logoUrl} shopName={shopName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{shopName}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Business Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <User className="h-3 w-3" />
              Business Name
            </label>
            <input
              type="text"
              required
              disabled={!isEditing}
              value={formData.shop_name}
              onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <Mail className="h-3 w-3" />
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <User className="h-3 w-3" />
              Contact Name
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="Enter contact person name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <Phone className="h-3 w-3" />
              Phone Number
            </label>
            <input
              type="tel"
              disabled={!isEditing}
              pattern="[0-9]{10}"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="10 digit number"
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
              <p className="text-xs text-green-700">Profile updated successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex-1 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  Change Password
                </button>
              </>
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  )
}
