import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ ok: false, error: 'user_id required' }, { status: 400 })

    // Verify caller is admin (via SSR cookies)
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (!isAdmin(profile?.role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    // Approve using service role (bypass RLS)
    const admin = await supabaseAdmin()
    const { error: pErr } = await admin.from('profiles').update({ role: 'reseller' }).eq('id', user_id)
    if (pErr) throw pErr
    const { error: rErr } = await admin.from('resellers').update({ status: 'approved' }).eq('user_id', user_id)
    if (rErr) throw rErr

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 400 })
  }
}
