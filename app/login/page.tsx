'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Eye } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = supabaseBrowser()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    // 🔑 Sync the session to server cookies for SSR guards
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'SIGNED_IN', session })
    })

    setLoading(false)
    router.replace('/reseller/dashboard')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-black p-4 md:p-0">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 text-white grid place-items-center mb-3">
              {/* Placeholder app icon */}
              <span className="text-lg font-bold">SL</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SilverLine B2B</h1>
            <p className="text-slate-500 text-sm">Secure Reseller Portal</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="reseller-email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="reseller-email"
                  className="w-full h-10 rounded-md border border-slate-300 bg-white pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="reseller@business.com"
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="reseller-password">Password</label>
              <div className="relative">
                <input
                  id="reseller-password"
                  type="password"
                  className="w-full h-10 rounded-md border border-slate-300 bg-white pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot Password?</Link>
            </div>

            <button
              disabled={loading}
              className="w-full h-11 rounded-md bg-blue-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="text-center text-sm text-slate-600 mt-4">
            <Link href="/register" className="text-blue-600 hover:underline">Become a Reseller</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
