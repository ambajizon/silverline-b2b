'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye } from 'lucide-react'

export default function Register() {
  const [shopName, setShopName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (password !== confirm) {
      setLoading(false)
      alert('Passwords do not match')
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          contact_name: contactName || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          email,
          password,
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Registration failed')
      setDone(true)
    } catch (err: any) {
      alert(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm text-center space-y-6">
          <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 grid place-items-center mx-auto text-2xl">◎</div>
          <div>
            <h2 className="text-lg font-semibold">Your application is in review</h2>
            <p className="text-slate-600 text-sm mt-1">You will be notified by email and text message once your application has been approved.</p>
          </div>
          <button onClick={()=>router.push('/login')} className="w-full h-11 rounded-md bg-blue-600 text-white font-semibold">Log In</button>
          <div className="text-xs text-slate-500">Admin Portal</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-4">
        <div className="text-center mb-2">
          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white grid place-items-center mx-auto mb-2">SL</div>
          <h1 className="text-2xl font-bold">SilverLine B2B</h1>
          <p className="text-slate-500 text-sm">Become a Reseller — The Art of Silver, Redefined</p>
        </div>

        <h2 className="text-center text-lg font-semibold">Reseller Registration</h2>

        <input className="border rounded px-3 py-2 w-full" placeholder="Business Name *" required value={shopName} onChange={e=>setShopName(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Contact Name" value={contactName} onChange={e=>setContactName(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Phone *" required pattern="[0-9]{10}" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Email *" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
        <textarea className="border rounded px-3 py-2 w-full" placeholder="Business Address *" required value={address} onChange={e=>setAddress(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2 w-full" placeholder="City *" required value={city} onChange={e=>setCity(e.target.value)} />
          <input className="border rounded px-3 py-2 w-full" placeholder="State *" required value={state} onChange={e=>setState(e.target.value)} />
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Pincode (6 digits) *" required pattern="[0-9]{6}" value={pincode} onChange={e=>setPincode(e.target.value)} />

        <div className="relative">
          <input className="border rounded px-3 py-2 w-full pr-10" placeholder="Create password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="h-4 w-4"/></button>
        </div>
        <div className="relative">
          <input className="border rounded px-3 py-2 w-full pr-10" placeholder="Re-enter password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="h-4 w-4"/></button>
        </div>

        <button disabled={loading} className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-50">
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div className="text-center text-sm text-gray-600">
          Already registered? <Link href="/login" className="text-blue-600 hover:underline">Log In</Link>
        </div>
        <div className="text-center text-xs text-slate-500">Admin Portal</div>
      </form>
    </div>
  )
}
