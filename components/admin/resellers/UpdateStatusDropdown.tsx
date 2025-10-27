'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface UpdateStatusDropdownProps {
  resellerId: string
  currentStatus: string
}

const statuses = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
  { value: 'suspended', label: 'Suspended', color: 'bg-orange-100 text-orange-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
]

export default function UpdateStatusDropdown({ resellerId, currentStatus }: UpdateStatusDropdownProps) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setIsOpen(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/admin/api/resellers/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reseller_id: resellerId, status: newStatus })
      })

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update status')
      }

      setIsOpen(false)
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const currentStatusObj = statuses.find(s => s.value === currentStatus) || statuses[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          currentStatusObj.color
        } ${loading ? 'opacity-50' : 'hover:opacity-80'} transition-opacity`}
      >
        {currentStatusObj.label}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusUpdate(status.value)}
                disabled={loading}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  status.value === currentStatus ? 'bg-slate-100 font-medium' : ''
                } ${loading ? 'opacity-50' : ''}`}
              >
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${status.color}`}>
                  {status.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
