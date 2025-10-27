'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, User, Phone, MapPin, FileText, Key } from 'lucide-react'
import { updateResellerInfo } from '@/app/(reseller)/reseller/account/actions'
import { ResellerProfile } from '@/app/(reseller)/reseller/account/actions'
import { useRouter } from 'next/navigation'
import ChangePasswordSheet from './ChangePasswordSheet'

const profileSchema = z.object({
  shop_name: z.string().min(2, 'Business name must be at least 2 characters').max(80, 'Too long'),
  contact_name: z.string().max(80, 'Too long').optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10,14}$/, 'Phone must be 10-14 digits').optional().or(z.literal('')),
  address: z.string().max(200, 'Address too long').optional().or(z.literal('')),
  city: z.string().max(50, 'City name too long').optional().or(z.literal('')),
  state: z.string().max(50, 'State name too long').optional().or(z.literal('')),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileInfoFormProps {
  profile: ResellerProfile
}

export default function ProfileInfoForm({ profile }: ProfileInfoFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordSheet, setShowPasswordSheet] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      shop_name: profile.shop_name,
      contact_name: profile.contact_name ?? '',
      phone: profile.phone ?? '',
      address: profile.address ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      pincode: profile.pincode ?? '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setError(null)
    setSuccess(false)

    const result = await updateResellerInfo({
      shop_name: data.shop_name,
      contact_name: data.contact_name || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
    })

    if (result.success) {
      setSuccess(true)
      setIsEditing(false)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error ?? 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    setError(null)
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Profile Information</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setShowPasswordSheet(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Key className="h-3 w-3" />
              Change Password
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Business Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <User className="h-3 w-3" />
              Business Name *
            </label>
            <input
              {...register('shop_name')}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="Your Business Name"
            />
            {errors.shop_name && (
              <p className="text-xs text-red-600 mt-1">{errors.shop_name.message}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <Mail className="h-3 w-3" />
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Contact Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <User className="h-3 w-3" />
              Contact Person
            </label>
            <input
              {...register('contact_name')}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="Contact person name"
            />
            {errors.contact_name && (
              <p className="text-xs text-red-600 mt-1">{errors.contact_name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <Phone className="h-3 w-3" />
              Phone Number
            </label>
            <input
              {...register('phone')}
              type="tel"
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="10-14 digits"
            />
            {errors.phone && (
              <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <MapPin className="h-3 w-3" />
              Address
            </label>
            <textarea
              {...register('address')}
              disabled={!isEditing}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 resize-none"
              placeholder="Street address"
            />
            {errors.address && (
              <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
                <MapPin className="h-3 w-3" />
                City
              </label>
              <input
                {...register('city')}
                disabled={!isEditing}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                placeholder="City"
              />
              {errors.city && (
                <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
                <MapPin className="h-3 w-3" />
                State
              </label>
              <input
                {...register('state')}
                disabled={!isEditing}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                placeholder="State"
              />
              {errors.state && (
                <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>
              )}
            </div>
          </div>

          {/* Pincode */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
              <MapPin className="h-3 w-3" />
              Pincode
            </label>
            <input
              {...register('pincode')}
              disabled={!isEditing}
              type="tel"
              pattern="[0-9]{6}"
              maxLength={6}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="6 digits"
            />
            {errors.pincode && (
              <p className="text-xs text-red-600 mt-1">{errors.pincode.message}</p>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">Profile updated successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Change Password Sheet */}
      <ChangePasswordSheet
        isOpen={showPasswordSheet}
        onClose={() => setShowPasswordSheet(false)}
      />
    </>
  )
}
