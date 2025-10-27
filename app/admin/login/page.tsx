'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Eye, Lock } from 'lucide-react'

export default function AdminLogin() {
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
    router.replace('/admin/dashboard')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-black p-4 md:p-0">
      <div className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-md">
        <div className="w-full bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-blue-600 text-4xl font-black leading-tight tracking-tighter">SilverLine B2B</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic mt-2">
              Secure Admin Portal for Shree Savariya Jewelers – The Art of Silver, Redefined
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-4 mb-2">
              Welcome back, Admin. Manage your wholesale empire securely.
            </p>
          </div>

          <h2 className="text-blue-800 dark:text-blue-500 text-xl font-bold text-center mt-4 mb-6">Admin Login</h2>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300" htmlFor="admin-email">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@shree.com"
                  className="flex w-full rounded-md border border-slate-300 bg-white h-10 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="flex w-full rounded-md border border-slate-300 bg-white h-10 pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Toggle password visibility">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <input id="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <label htmlFor="remember-me" className="text-xs text-slate-600 dark:text-slate-400">Remember me for 30 days</label>
              </div>
              <a href="#" className="text-xs text-blue-600 hover:underline">Forgot Password?</a>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-500">Use on trusted devices only.</p>

            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold text-base rounded-md h-12 mt-2 transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/login" className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:underline">
              Not an admin? Switch to Reseller Login
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-6 pt-4 border-t border-slate-200">
            <Lock className="h-3.5 w-3.5" />
            <span>Protected by Supabase Auth | Secure Connection</span>
          </div>
        </div>
      </div>
    </div>
  )
}
