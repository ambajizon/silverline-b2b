'use server'

import { supabaseServer } from '@/lib/supabase-server'

type ActionResult =
  | { ok: true; data?: any }
  | { ok: false; error: string }

async function verifyReseller() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase, resellerId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'reseller') return { authorized: false, supabase, resellerId: null }

  // Get reseller ID
  const { data: reseller } = await supabase
    .from('resellers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!reseller) return { authorized: false, supabase, resellerId: null }

  return { authorized: true, supabase, resellerId: reseller.id }
}

export async function getResellerPaymentSummary(): Promise<ActionResult> {
  try {
    const { authorized, supabase, resellerId } = await verifyReseller()
    if (!authorized || !resellerId) return { ok: false, error: 'Unauthorized' }

    // Get outstanding balance from view
    const { data: outstanding, error } = await supabase
      .from('v_reseller_outstanding')
      .select('*')
      .eq('reseller_id', resellerId)
      .maybeSingle()

    if (error) throw error

    return {
      ok: true,
      data: {
        invoiced: Number(outstanding?.invoiced || 0),
        received: Number(outstanding?.received || 0),
        outstanding: Number(outstanding?.outstanding || 0),
        last_payment_date: outstanding?.last_payment_date,
        last_payment_amount: Number(outstanding?.last_payment_amount || 0),
      }
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch payment summary' }
  }
}

export async function getResellerPaymentHistory(): Promise<ActionResult> {
  try {
    const { authorized, supabase, resellerId } = await verifyReseller()
    if (!authorized || !resellerId) return { ok: false, error: 'Unauthorized' }

    // Get payment history
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      ok: true,
      data: payments || []
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch payment history' }
  }
}
