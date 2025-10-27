'use client'

import { LogOut } from 'lucide-react'
import { logout } from '@/lib/auth-actions'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-2 px-3 py-2 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
    >
      <LogOut className="h-5 w-5" />
      <span>{loading ? 'Logging out...' : 'Logout'}</span>
    </button>
  )
}
