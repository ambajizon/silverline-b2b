'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { RecordPaymentInput, CreateTargetInput, ResellerStatus } from '@/types/resellers'

type ActionResult =
  | { ok: true; data?: any }
  | { ok: false; error: string }

async function verifyAdmin() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') return { authorized: false, supabase }
  return { authorized: true, supabase }
}

export async function approveReseller(id: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('resellers')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/resellers')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to approve reseller' }
  }
}

export async function suspendReseller(id: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('resellers')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/resellers')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to suspend reseller' }
  }
}

export async function rejectReseller(id: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('resellers')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/resellers')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to reject reseller' }
  }
}

export async function updateResellerProfile(
  id: string,
  payload: {
    shop_name?: string
    contact_name?: string
    phone?: string
    address?: string
    logo_url?: string
    brand_color_primary?: string
    brand_color_secondary?: string
  }
): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('resellers')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath(`/admin/resellers/${id}`)
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update profile' }
  }
}

export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const paymentData = {
      reseller_id: input.reseller_id,
      order_id: input.order_id || null,
      amount: input.amount,
      payment_mode: input.payment_mode,
      reference: input.reference || null,
      note: input.note || null,
      status: 'completed',
      paid_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('payments')
      .insert(paymentData)

    if (error) throw error

    revalidatePath(`/admin/resellers/${input.reseller_id}`)
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to record payment' }
  }
}

export async function createTarget(input: CreateTargetInput): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('targets')
      .insert({
        reseller_id: input.reseller_id,
        name: input.name,
        type: input.type,
        goal: input.goal,
        deadline: input.deadline,
        reward_type: input.reward_type,
        reward_value: input.reward_value,
        status: 'active',
      })

    if (error) throw error

    revalidatePath(`/admin/resellers/${input.reseller_id}`)
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to create target' }
  }
}

export async function updateTarget(
  id: string,
  payload: {
    name?: string
    goal?: number
    deadline?: string
    status?: string
  }
): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('targets')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/resellers')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update target' }
  }
}

export async function deleteReseller(id: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('resellers')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/resellers')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to delete reseller' }
  }
}
