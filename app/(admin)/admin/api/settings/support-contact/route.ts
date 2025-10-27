import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const { name, email, phone } = await req.json()
    
    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { ok: false, error: 'All fields are required' },
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

    // Update support contact using service role
    const admin = await supabaseAdmin()
    
    const supportContact = { name, email, phone }
    
    // Upsert into app_settings table
    const { error: updateError } = await admin
      .from('app_settings')
      .upsert({
        setting_key: 'support_contact',
        setting_value: supportContact,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key'
      })
    
    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Update support contact error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
