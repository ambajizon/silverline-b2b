'use client'
import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Link from 'next/link'
import { Mail, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) return alert(error.message)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6">
        <div className="text-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white grid place-items-center mx-auto mb-3">SL</div>
          <h1 className="text-2xl font-bold">SilverLine B2B</h1>
          <p className="text-slate-500 text-sm">Secure Reseller Portal</p>
        </div>

        {!sent ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="reseller@silverline.com"
                  className="w-full h-10 rounded-md border border-slate-300 bg-white pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"/>
              </div>
            </div>
            <button disabled={loading} className="w-full h-11 rounded-md bg-blue-600 text-white font-semibold disabled:opacity-50">
              {loading? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-center text-sm text-slate-600">
              <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5"/><span>Link sent! Check your email.</span></div>
            <button onClick={onSubmit} className="text-blue-600 text-sm hover:underline" type="button">Resend</button>
            <div className="text-center text-sm text-slate-600">
              <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
