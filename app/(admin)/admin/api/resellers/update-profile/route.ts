import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const { reseller_id, shop_name, contact_name, phone, address, city, state, pincode } = await req.json()
    
    if (!reseller_id || !shop_name || !contact_name || !phone || !address) {
      return NextResponse.json(
        { ok: false, error: 'Required fields missing' },
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

    // Update reseller profile using service role
    const admin = await supabaseAdmin()
    
    const { error: updateError } = await admin
      .from('resellers')
      .update({
        shop_name,
        contact_name,
        phone,
        address,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reseller_id)
    
    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Update profile error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
