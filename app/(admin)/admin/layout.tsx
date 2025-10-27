// apps/web/app/(admin)/admin/layout.tsx
import React from 'react'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/roles'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Use regular client for auth check
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Use admin client (service role) to bypass RLS for role check
  const adminClient = await supabaseAdmin()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!isAdmin(profile?.role)) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white p-4 flex flex-col">
        <div className="text-xl font-semibold mb-4">SilverLine B2B</div>
        <nav className="space-y-1 flex-1">
          <Link href="/admin/dashboard" className="block rounded px-3 py-2 hover:bg-slate-800">Dashboard</Link>
          <Link href="/admin/orders" className="block rounded px-3 py-2 hover:bg-slate-800">Orders</Link>
          <Link href="/admin/products" className="block rounded px-3 py-2 hover:bg-slate-800">Products</Link>
          <Link href="/admin/categories" className="block rounded px-3 py-2 hover:bg-slate-800">Categories</Link>
          <Link href="/admin/resellers" className="block rounded px-3 py-2 hover:bg-slate-800">Resellers</Link>
          <Link href="/admin/targets" className="block rounded px-3 py-2 hover:bg-slate-800">Targets</Link>
          <Link href="/admin/reports" className="block rounded px-3 py-2 hover:bg-slate-800">Reports</Link>
          <Link href="/admin/payments" className="block rounded px-3 py-2 hover:bg-slate-800">Payments</Link>
          <Link href="/admin/rewards" className="block rounded px-3 py-2 hover:bg-slate-800">Rewards</Link>
          <Link href="/admin/settings" className="block rounded px-3 py-2 hover:bg-slate-800">Settings</Link>
        </nav>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
