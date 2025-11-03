'use client'

import { useState } from 'react'
import { Edit2, Save, X } from 'lucide-react'
import { updateOrderNotes } from '@/app/(admin)/admin/orders/actions'
import { useRouter } from 'next/navigation'

interface EditableOrderNotesProps {
  orderId: string
  initialNotes: string | null
}

export default function EditableOrderNotes({ orderId, initialNotes }: EditableOrderNotesProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)

  // Extract only the notes part, remove shipping details
  const extractNotes = (rawNotes: string | null) => {
    if (!rawNotes) return ''
    
    // If notes contain "Shipping:", extract everything before it
    const shippingIndex = rawNotes.indexOf('Shipping:')
    if (shippingIndex > 0) {
      return rawNotes.substring(0, shippingIndex).trim()
    }
    
    return rawNotes
  }

  const displayNotes = extractNotes(notes)

  const handleSave = async () => {
    setSaving(true)
    const result = await updateOrderNotes(orderId, notes)
    
    if (result.success) {
      setIsEditing(false)
      router.refresh()
    } else {
      alert(result.error || 'Failed to update notes')
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Order Notes</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit notes"
          >
            <Edit2 className="h-4 w-4 text-slate-600" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              title="Save"
            >
              <Save className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full min-h-[120px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Add order notes..."
        />
      ) : (
        <div className="text-sm text-slate-600 whitespace-pre-wrap">
          {displayNotes || 'No notes available'}
        </div>
      )}
    </div>
  )
}
