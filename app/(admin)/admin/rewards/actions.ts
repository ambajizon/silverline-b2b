'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'

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
  return { authorized: true, supabase, userId: user.id }
}

// Get rewards catalog
export async function getRewardsCatalog(): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('rewards_catalog')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    return { ok: true, data: data || [] }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch rewards catalog' }
  }
}

// Get claimed rewards
export async function getClaimedRewards(filters: {
  status?: string
  reseller_id?: string
  page?: number
} = {}): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    let query = supabase
      .from('v_rewards_summary')
      .select('*', { count: 'exact' })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.reseller_id) {
      query = query.eq('reseller_id', filters.reseller_id)
    }

    const page = filters.page || 1
    const pageSize = 20
    const offset = (page - 1) * pageSize

    const { data, count, error } = await query
      .order('claimed_date', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    // Get summary stats
    const { data: stats } = await supabase
      .from('rewards_claimed')
      .select('status, cash_amount, item_value')

    const summary = {
      total: count || 0,
      pending: stats?.filter(s => s.status === 'pending').length || 0,
      delivered: stats?.filter(s => s.status === 'delivered').length || 0,
      totalValue: stats?.reduce((sum, s) => sum + (s.cash_amount || 0) + (s.item_value || 0), 0) || 0,
    }

    return {
      ok: true,
      data: {
        rewards: data || [],
        total: count || 0,
        summary,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch claimed rewards' }
  }
}

// Approve reward claim
export async function approveReward(claimId: string): Promise<ActionResult> {
  try {
    const { authorized, supabase, userId } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('rewards_claimed')
      .update({
        status: 'approved',
        approved_date: new Date().toISOString().split('T')[0],
        approved_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)

    if (error) throw error

    revalidatePath('/admin/rewards')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to approve reward' }
  }
}

// Mark reward as delivered
export async function markRewardDelivered(
  claimId: string,
  trackingNumber?: string,
  deliveryNotes?: string
): Promise<ActionResult> {
  try {
    const { authorized, supabase, userId } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('rewards_claimed')
      .update({
        status: 'delivered',
        delivered_date: new Date().toISOString().split('T')[0],
        delivered_by: userId,
        tracking_number: trackingNumber || null,
        delivery_notes: deliveryNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)

    if (error) throw error

    revalidatePath('/admin/rewards')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to mark as delivered' }
  }
}

// Create manual reward entry
export async function createManualReward(input: {
  reseller_id: string
  reward_name: string
  reward_type: string
  cash_amount: number
  item_value: number
  notes?: string
}): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('rewards_claimed')
      .insert({
        ...input,
        status: 'pending',
        claimed_date: new Date().toISOString().split('T')[0],
      })

    if (error) throw error

    revalidatePath('/admin/rewards')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to create reward' }
  }
}
