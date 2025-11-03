'use client'

import { LogOut } from 'lucide-react'
import { logoutReseller } from '@/lib/auth-actions'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return
    
    setLoading(true)
    try {
      await logoutReseller()
    } catch (error) {
      console.error('Logout error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut className="h-5 w-5" />
      <span className="font-medium">{loading ? 'Logging out...' : 'Logout'}</span>
    </button>
  )
}
