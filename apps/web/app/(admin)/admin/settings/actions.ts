'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { SilverRate, Profile } from '@/types/settings'

type ActionResult<T = any> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function verifyAdmin() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase, userId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') return { authorized: false, supabase, userId: null }
  return { authorized: true, supabase, userId: user.id }
}

// ============ SILVER RATE ============

export async function updateSilverRate(per10g: number): Promise<ActionResult> {
  try {
    const { authorized, supabase, userId } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const ratePerGram = per10g / 10

    const { error } = await supabase
      .from('silver_rates')
      .insert({
        rate_per_gram: ratePerGram,
        updated_by: userId,
      })

    if (error) throw error

    revalidatePath('/admin/settings')
    revalidatePath('/reseller/dashboard')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update silver rate' }
  }
}

export async function getCurrentSilverRate(): Promise<ActionResult<number>> {
  try {
    const supabase = await supabaseServer()

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_silver_rate')

    if (!rpcError && rpcData !== null) {
      return { ok: true, data: rpcData }
    }

    // Fallback to latest row
    const { data, error } = await supabase
      .from('silver_rates')
      .select('rate_per_gram')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return { ok: true, data: data?.rate_per_gram || 0 }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch silver rate' }
  }
}

export async function fetchSilverRateHistory(limit: number = 10): Promise<ActionResult<SilverRate[]>> {
  try {
    const supabase = await supabaseServer()

    // Fetch silver rates
    const { data: ratesData, error } = await supabase
      .from('silver_rates')
      .select('id, rate_per_gram, created_at, updated_by')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    if (!ratesData || ratesData.length === 0) {
      return { ok: true, data: [] }
    }

    // Get unique user IDs (exclude nulls)
    const userIds = [...new Set(ratesData.map(r => r.updated_by).filter(Boolean))]

    // Fetch profiles for these users
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']) // Dummy ID if empty

    // Create a map of user ID to email
    const profileMap = new Map((profilesData || []).map(p => [p.id, p.email]))

    // Map rates with profile emails
    const rates: SilverRate[] = ratesData.map((row: any) => ({
      id: row.id,
      rate_per_gram: row.rate_per_gram,
      created_at: row.created_at,
      updated_by: row.updated_by,
      updated_by_email: row.updated_by ? profileMap.get(row.updated_by) || 'System' : 'System',
    }))

    return { ok: true, data: rates }
  } catch (error: any) {
    console.error('fetchSilverRateHistory error:', error)
    return { ok: false, error: error.message || 'Failed to fetch rate history' }
  }
}

// ============ SETTINGS ============

export async function getSettings(keys: string[]): Promise<ActionResult<Record<string, string>>> {
  try {
    const supabase = await supabaseServer()

    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', keys)

    if (error) throw error

    const result: Record<string, string> = {}
    data?.forEach((row) => {
      result[row.key] = row.value
    })

    return { ok: true, data: result }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch settings' }
  }
}

export async function upsertSettings(payload: Record<string, string>): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const entries = Object.entries(payload).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('settings')
      .upsert(entries, { onConflict: 'key' })

    if (error) throw error

    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update settings' }
  }
}

// ============ USER ROLES ============

export async function listProfiles(): Promise<ActionResult<Profile[]>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { ok: true, data: data || [] }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch profiles' }
  }
}

export async function updateProfileRole(id: string, role: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update user role' }
  }
}

export async function bulkAssignRoles(ids: string[], role: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .in('id', ids)

    if (error) throw error

    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to assign roles' }
  }
}

export async function deactivateProfiles(ids: string[]): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'inactive', updated_at: new Date().toISOString() })
      .in('id', ids)

    if (error) throw error

    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to deactivate profiles' }
  }
}

export async function addProfileByEmail(email: string, role: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return { ok: false, error: 'User with this email already exists' }
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        email,
        role,
        created_at: new Date().toISOString(),
      })

    if (error) throw error

    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to add user' }
  }
}

// ============ DANGER ZONE ============

export async function broadcastTestNotification(message: string): Promise<ActionResult> {
  try {
    const { authorized, supabase, userId } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Try to insert notification (table might not exist)
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'test',
        message,
        created_at: new Date().toISOString(),
      })

    // If table doesn't exist, just return success
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return { ok: true, data: 'Notification table not found (skipped)' }
    }

    if (error) throw error

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to broadcast notification' }
  }
}

// ============ SUPPORT CONTACT ============

export async function getSupportContact(): Promise<ActionResult<{ name: string; email: string; phone: string }>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data: settings } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'support_contact')
      .maybeSingle()

    if (settings?.setting_value) {
      return { ok: true, data: settings.setting_value as { name: string; email: string; phone: string } }
    }

    // Return default support contact
    return {
      ok: true,
      data: {
        name: 'Support Team',
        email: 'support@gujaratjewellery.com',
        phone: '+91 98765 43210',
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch support contact' }
  }
}

// ============ TESTING UTILITIES ============

export async function getResellersForTesting(): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data: resellers, error } = await supabase
      .from('resellers')
      .select('id, shop_name, contact_name, phone')
      .order('shop_name', { ascending: true })

    if (error) throw error

    return { ok: true, data: resellers || [] }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch resellers' }
  }
}

export async function clearResellerData(resellerId: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Get counts before deletion for confirmation message
    const [ordersCount, paymentsCount, targetsCount, rewardsCount] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('reseller_id', resellerId),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('reseller_id', resellerId),
      supabase.from('targets').select('id', { count: 'exact', head: true }).eq('reseller_id', resellerId),
      supabase.from('rewards_claimed').select('id', { count: 'exact', head: true }).eq('reseller_id', resellerId),
    ])

    const counts = {
      orders: ordersCount.count || 0,
      payments: paymentsCount.count || 0,
      targets: targetsCount.count || 0,
      rewards: rewardsCount.count || 0,
    }

    // Get target IDs and order IDs for this reseller
    const { data: targetIds } = await supabase
      .from('targets')
      .select('id')
      .eq('reseller_id', resellerId)
    
    const { data: orderIds } = await supabase
      .from('orders')
      .select('id')
      .eq('reseller_id', resellerId)

    // Delete in correct order (child tables first)
    const results = []
    
    // Delete rewards
    results.push(await supabase.from('rewards_claimed').delete().eq('reseller_id', resellerId))
    
    // Delete target progress
    if (targetIds && targetIds.length > 0) {
      results.push(await supabase.from('target_progress').delete().in('target_id', targetIds.map(t => t.id)))
    }
    
    // Delete targets
    results.push(await supabase.from('targets').delete().eq('reseller_id', resellerId))
    
    // Delete payments
    results.push(await supabase.from('payments').delete().eq('reseller_id', resellerId))
    
    // Delete order items
    if (orderIds && orderIds.length > 0) {
      results.push(await supabase.from('order_items').delete().in('order_id', orderIds.map(o => o.id)))
    }
    
    // Delete orders
    results.push(await supabase.from('orders').delete().eq('reseller_id', resellerId))
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw new Error(errors[0].error?.message || 'Failed to delete some data')
    }

    revalidatePath('/admin/orders')
    revalidatePath('/admin/payments')
    revalidatePath('/admin/targets')
    revalidatePath('/admin/rewards')

    return {
      ok: true,
      data: {
        message: `Successfully cleared data for reseller`,
        counts,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to clear reseller data' }
  }
}

export async function clearAllResellersData(): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Try using database function first (if it exists)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('clear_all_test_data')
    
    if (!rpcError && rpcResult?.success) {
      // Database function worked
      revalidatePath('/admin/orders')
      revalidatePath('/admin/payments')
      revalidatePath('/admin/targets')
      revalidatePath('/admin/rewards')
      revalidatePath('/admin/dashboard')
      
      return {
        ok: true,
        data: {
          message: `Successfully cleared ALL data for all resellers`,
          counts: rpcResult.deleted || {},
        },
      }
    }

    // Fallback: manual deletion if RPC doesn't exist
    // Get all IDs first, then delete them
    const { data: ordersIds } = await supabase.from('orders').select('id')
    const { data: orderItemsIds } = await supabase.from('order_items').select('id')
    const { data: paymentsIds } = await supabase.from('payments').select('id')
    const { data: targetsIds } = await supabase.from('targets').select('id')
    const { data: targetProgressIds } = await supabase.from('target_progress').select('id')
    const { data: rewardsIds } = await supabase.from('rewards_claimed').select('id')

    const counts = {
      orders: ordersIds?.length || 0,
      payments: paymentsIds?.length || 0,
      targets: targetsIds?.length || 0,
      rewards: rewardsIds?.length || 0,
    }

    // Delete in correct order (child tables first)
    const results = []
    
    if (rewardsIds && rewardsIds.length > 0) {
      const { error } = await supabase.from('rewards_claimed').delete().in('id', rewardsIds.map(r => r.id))
      if (error) results.push({ error })
    }
    
    if (targetProgressIds && targetProgressIds.length > 0) {
      const { error } = await supabase.from('target_progress').delete().in('id', targetProgressIds.map(r => r.id))
      if (error) results.push({ error })
    }
    
    if (targetsIds && targetsIds.length > 0) {
      const { error } = await supabase.from('targets').delete().in('id', targetsIds.map(r => r.id))
      if (error) results.push({ error })
    }
    
    if (paymentsIds && paymentsIds.length > 0) {
      const { error } = await supabase.from('payments').delete().in('id', paymentsIds.map(r => r.id))
      if (error) results.push({ error })
    }
    
    if (orderItemsIds && orderItemsIds.length > 0) {
      const { error } = await supabase.from('order_items').delete().in('id', orderItemsIds.map(r => r.id))
      if (error) results.push({ error })
    }
    
    if (ordersIds && ordersIds.length > 0) {
      const { error } = await supabase.from('orders').delete().in('id', ordersIds.map(r => r.id))
      if (error) results.push({ error })
    }
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw new Error(errors[0].error?.message || 'Failed to delete some data')
    }

    // Revalidate all paths to clear cache
    revalidatePath('/admin/dashboard', 'page')
    revalidatePath('/admin/orders', 'page')
    revalidatePath('/admin/payments', 'page')
    revalidatePath('/admin/targets', 'page')
    revalidatePath('/admin/rewards', 'page')
    revalidatePath('/admin/reports', 'page')
    revalidatePath('/', 'layout') // Revalidate entire app

    return {
      ok: true,
      data: {
        message: `Successfully cleared ALL data for all resellers`,
        counts,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to clear all data' }
  }
}
