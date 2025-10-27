import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const { reseller_id, status } = await req.json()
    
    if (!reseller_id || !status) {
      return NextResponse.json(
        { ok: false, error: 'reseller_id and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'suspended', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Verify caller is admin
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    
    if (!isAdmin(profile?.role)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get reseller user_id
    const { data: reseller } = await supabase
      .from('resellers')
      .select('user_id')
      .eq('id', reseller_id)
      .single()

    if (!reseller) {
      return NextResponse.json(
        { ok: false, error: 'Reseller not found' },
        { status: 404 }
      )
    }

    // Update status using service role (bypass RLS)
    const admin = await supabaseAdmin()
    
    // Update resellers table
    const { error: resellerError } = await admin
      .from('resellers')
      .update({ status })
      .eq('id', reseller_id)
    
    if (resellerError) throw resellerError

    // Keep role as 'reseller' for all statuses - allows login
    // Status check will happen after login in the reseller layout
    // This ensures user can login but will see appropriate message based on status
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'reseller' })
      .eq('id', reseller.user_id)
    
    if (profileError) throw profileError

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Update status error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
