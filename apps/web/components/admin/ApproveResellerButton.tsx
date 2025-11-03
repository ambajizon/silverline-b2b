'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveResellerButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onApprove = async () => {
    try {
      setLoading(true)
      const res = await fetch('/admin/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to approve')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onApprove}
      disabled={loading}
      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-50"
    >
      {loading ? 'Approving…' : 'Approve'}
    </button>
  )
}
