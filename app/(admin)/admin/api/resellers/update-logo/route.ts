import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const { reseller_id, logo_url } = await req.json()
    
    if (!reseller_id || !logo_url) {
      return NextResponse.json(
        { ok: false, error: 'reseller_id and logo_url are required' },
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

    // Update logo using service role (bypass RLS)
    const admin = await supabaseAdmin()
    
    const { error: updateError } = await admin
      .from('resellers')
      .update({ 
        logo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', reseller_id)
    
    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Update logo error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
