import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/roles'

export async function POST(req: Request) {
  try {
    const { reseller_id, credit_limit, discount_percentage, extra_charges_percentage, payment_terms } = await req.json()
    
    if (!reseller_id) {
      return NextResponse.json(
        { ok: false, error: 'reseller_id is required' },
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

    // Update financial details using service role
    const admin = await supabaseAdmin()
    
    const { error: updateError } = await admin
      .from('resellers')
      .update({
        credit_limit: credit_limit || null,
        discount_percent: discount_percentage || null,
        extra_charges_percent: extra_charges_percentage || null,
        payment_terms: payment_terms || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reseller_id)
    
    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Update financial error:', e)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
