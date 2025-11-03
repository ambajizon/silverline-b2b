'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Headphones, Save, Loader2 } from 'lucide-react'

const supportContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[0-9\s\-()]{10,20}$/, 'Invalid phone number'),
})

type SupportContactForm = z.infer<typeof supportContactSchema>

interface SupportContactTabProps {
  supportContact: {
    name: string
    email: string
    phone: string
  }
}

export default function SupportContactTab({ supportContact }: SupportContactTabProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SupportContactForm>({
    resolver: zodResolver(supportContactSchema),
    defaultValues: supportContact,
  })

  const onSubmit = async (data: SupportContactForm) => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/admin/api/settings/support-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to update support contact')
      }

      setMessage({ type: 'success', text: 'Support contact updated successfully!' })
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update support contact' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-50 p-3 rounded-lg">
          <Headphones className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Support Contact</h2>
          <p className="text-sm text-slate-600">
            Manage contact information shown to resellers on the support page
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Support Team Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g., Customer Support Team"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="support@company.com"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            {...register('phone')}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Include country code (e.g., +91 for India)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
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
          {isDirty && !saving && (
            <p className="text-sm text-slate-600">You have unsaved changes</p>
          )}
        </div>
      </form>

      {/* Preview */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Preview</h3>
        <p className="text-xs text-slate-600 mb-4">
          This is how resellers will see your contact information on the support page
        </p>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 max-w-md">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <Headphones className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Support Team</p>
              <p className="text-sm font-medium text-slate-900">{supportContact.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded">
              <span className="text-green-600 text-sm">📞</span>
            </div>
            <div>
              <p className="text-xs text-slate-600">Phone</p>
              <p className="text-sm font-medium text-green-600">{supportContact.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <span className="text-blue-600 text-sm">✉️</span>
            </div>
            <div>
              <p className="text-xs text-slate-600">Email</p>
              <p className="text-sm font-medium text-blue-600 break-all">{supportContact.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
