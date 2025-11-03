'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { upsertSettings } from '@/app/(admin)/admin/settings/actions'

interface SystemDefaultsTabProps {
  settings: Record<string, string>
}

export default function SystemDefaultsTab({ settings }: SystemDefaultsTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [emailTemplates, setEmailTemplates] = useState(() => {
    try {
      return JSON.stringify(JSON.parse(settings.email_templates || '{}'), null, 2)
    } catch {
      return '{}'
    }
  })
  
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    try {
      return JSON.stringify(JSON.parse(settings.notification_prefs || '{}'), null, 2)
    } catch {
      return '{}'
    }
  })

  const [emailError, setEmailError] = useState('')
  const [notifError, setNotifError] = useState('')

  const validateJSON = (value: string, setError: (msg: string) => void) => {
    try {
      JSON.parse(value)
      setError('')
      return true
    } catch (e: any) {
      setError(e.message || 'Invalid JSON')
      return false
    }
  }

  const handleSave = async () => {
    // Validate both JSON fields
    const emailValid = validateJSON(emailTemplates, setEmailError)
    const notifValid = validateJSON(notificationPrefs, setNotifError)

    if (!emailValid || !notifValid) {
      toast.error('Please fix JSON errors before saving')
      return
    }

    setLoading(true)

    const result = await upsertSettings({
      email_templates: emailTemplates,
      notification_prefs: notificationPrefs,
    })

    if (result.ok) {
      toast.success('System defaults updated successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  const handleReset = () => {
    try {
      setEmailTemplates(JSON.stringify(JSON.parse(settings.email_templates || '{}'), null, 2))
      setNotificationPrefs(JSON.stringify(JSON.parse(settings.notification_prefs || '{}'), null, 2))
      setEmailError('')
      setNotifError('')
    } catch {
      setEmailTemplates('{}')
      setNotificationPrefs('{}')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">System Defaults</h2>
        <p className="text-sm text-slate-600 mt-1">Configure system-wide default settings</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Email Templates */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Templates (JSON)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Configure email templates for various notifications
          </p>
          <textarea
            value={emailTemplates}
            onChange={(e) => {
              setEmailTemplates(e.target.value)
              validateJSON(e.target.value, setEmailError)
            }}
            rows={12}
            className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 ${
              emailError ? 'border-red-500 focus:ring-red-600' : 'border-slate-300 focus:ring-blue-600'
            }`}
            placeholder='{\n  "welcome": "...",\n  "order_confirmation": "..."\n}'
          />
          {emailError && (
            <p className="text-red-500 text-xs mt-1">❌ {emailError}</p>
          )}
          {!emailError && emailTemplates && (
            <p className="text-green-600 text-xs mt-1">✓ Valid JSON</p>
          )}
        </div>

        {/* Notification Preferences */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notification Preferences (JSON)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Configure default notification settings
          </p>
          <textarea
            value={notificationPrefs}
            onChange={(e) => {
              setNotificationPrefs(e.target.value)
              validateJSON(e.target.value, setNotifError)
            }}
            rows={12}
            className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 ${
              notifError ? 'border-red-500 focus:ring-red-600' : 'border-slate-300 focus:ring-blue-600'
            }`}
            placeholder='{\n  "email_notifications": true,\n  "sms_notifications": false\n}'
          />
          {notifError && (
            <p className="text-red-500 text-xs mt-1">❌ {notifError}</p>
          )}
          {!notifError && notificationPrefs && (
            <p className="text-green-600 text-xs mt-1">✓ Valid JSON</p>
          )}
        </div>

        {/* Helper Text */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            <strong>Warning:</strong> Invalid JSON will prevent saving. Ensure proper formatting before submitting.
          </p>
        </div>

        {/* Save Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading || !!emailError || !!notifError}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
