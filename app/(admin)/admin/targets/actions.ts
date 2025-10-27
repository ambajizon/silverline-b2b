'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { CreateTargetInput, UpdateTargetInput, TargetFilters } from '@/types/targets'

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

export async function getTargetsAdmin(filters: TargetFilters = {}) {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) throw new Error('Unauthorized')

    // Try RPC first
    const { data, error } = await supabase.rpc('get_targets_admin', {
      p_status: filters.status || null,
      p_type: filters.type || null,
      p_reseller_id: filters.reseller_id || null,
      p_qualification: filters.qualification || 'any',
      p_date_from: filters.date_from || null,
      p_date_to: filters.date_to || null,
      p_search: filters.search || null,
      p_page: filters.page || 1,
      p_limit: filters.limit || 20,
    })

    if (error) {
      // Fallback to direct query if RPC doesn't exist
      console.log('RPC not found, using direct query', error)
      return await getTargetsDirectQuery(supabase, filters)
    }

    return { ok: true, data }
  } catch (error: any) {
    console.error('Failed to fetch targets:', error)
    return { ok: false, error: error.message || 'Failed to fetch targets' }
  }
}

async function getTargetsDirectQuery(supabase: any, filters: TargetFilters) {
  let query = supabase
    .from('targets')
    .select(`
      *,
      resellers(shop_name),
      target_progress(current_value)
    `, { count: 'exact' })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.reseller_id) query = query.eq('reseller_id', filters.reseller_id)
  if (filters.date_from) query = query.gte('deadline', filters.date_from)
  if (filters.date_to) query = query.lte('deadline', filters.date_to)
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,terms.ilike.%${filters.search}%`)
  }

  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  const { data: targets, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Compute KPIs
  const { data: allTargets } = await supabase
    .from('targets')
    .select('*, target_progress(current_value)')

  const kpis = {
    active_challenges: allTargets?.filter((t: any) => t.status === 'active').length || 0,
    qualified_this_month: 0,
    not_qualified: 0,
    avg_progress: 0,
    expected_rewards: 0,
    roi: 0,
  }

  // Transform targets
  const transformedTargets = (targets || []).map((t: any) => ({
    ...t,
    reseller_name: t.resellers?.shop_name || 'Open to all',
    current_progress: t.target_progress?.[0]?.current_value || 0,
    progress_percentage: Math.min(100, ((t.target_progress?.[0]?.current_value || 0) / t.goal) * 100),
    is_qualified: (t.target_progress?.[0]?.current_value || 0) >= t.goal,
  }))

  return {
    ok: true,
    data: {
      targets: transformedTargets,
      total: count || 0,
      kpis,
    },
  }
}

export async function getTargetDetail(targetId: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) throw new Error('Unauthorized')

    // Try RPC first
    const { data, error } = await supabase.rpc('get_target_detail', {
      p_target_id: targetId,
    })

    if (error) {
      // Fallback to direct query
      const { data: target } = await supabase
        .from('targets')
        .select(`
          *,
          resellers(shop_name, profiles(email)),
          target_progress(*)
        `)
        .eq('id', targetId)
        .single()

      if (!target) throw new Error('Target not found')

      const progressHistory = target.target_progress || []
      const currentProgress = progressHistory.reduce((sum: number, p: any) => sum + (p.delta_value || 0), 0)

      return {
        ok: true,
        data: {
          ...target,
          reseller_name: target.resellers?.shop_name || 'Open to all',
          reseller_email: target.resellers?.profiles?.email || null,
          current_progress: currentProgress,
          progress_percentage: Math.min(100, (currentProgress / target.goal) * 100),
          is_qualified: currentProgress >= target.goal,
          progress_history: progressHistory,
        },
      }
    }

    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch target detail' }
  }
}

export async function createTarget(input: CreateTargetInput): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Try RPC first
    const { data, error } = await supabase.rpc('create_target', {
      p_payload: input,
    })

    if (error) {
      // Fallback to direct insert
      const { data: newTarget, error: insertError } = await supabase
        .from('targets')
        .insert({
          reseller_id: input.reseller_id || null,
          name: input.name,
          type: input.type,
          goal: input.goal,
          deadline: input.deadline,
          terms: input.terms || null,
          notes: input.notes || null,
          reward_type: input.reward_type || null,
          reward_value: input.reward_value || null,
          open_participation: input.open_participation || false,
          status: 'active',
        })
        .select()
        .single()

      if (insertError) throw insertError
      
      revalidatePath('/admin/targets')
      return { ok: true, data: newTarget }
    }

    revalidatePath('/admin/targets')
    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to create target' }
  }
}

export async function updateTarget(input: UpdateTargetInput): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { id, ...payload } = input

    // Try RPC first
    const { data, error } = await supabase.rpc('update_target', {
      p_target_id: id,
      p_payload: payload,
    })

    if (error) {
      // Fallback to direct update
      const { data: updated, error: updateError } = await supabase
        .from('targets')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      revalidatePath('/admin/targets')
      revalidatePath(`/admin/targets/${id}`)
      return { ok: true, data: updated }
    }

    revalidatePath('/admin/targets')
    revalidatePath(`/admin/targets/${id}`)
    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update target' }
  }
}

export async function recordTargetProgress(
  targetId: string,
  deltaValue: number,
  note?: string
): Promise<ActionResult> {
  try {
    const { authorized, supabase, userId } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Try RPC first
    const { data, error } = await supabase.rpc('record_target_progress', {
      p_target_id: targetId,
      p_delta_value: deltaValue,
      p_note: note || null,
    })

    if (error) {
      // Fallback: get current progress, then insert
      const { data: progressData } = await supabase
        .from('target_progress')
        .select('current_value')
        .eq('target_id', targetId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const currentValue = (progressData?.current_value || 0) + deltaValue

      const { data: newProgress, error: insertError } = await supabase
        .from('target_progress')
        .insert({
          target_id: targetId,
          current_value: currentValue,
          delta_value: deltaValue,
          note: note || null,
          updated_by: userId,
        })
        .select()
        .single()

      if (insertError) throw insertError

      revalidatePath(`/admin/targets/${targetId}`)
      return { ok: true, data: newProgress }
    }

    revalidatePath(`/admin/targets/${targetId}`)
    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to record progress' }
  }
}

export async function deleteTarget(targetId: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('targets')
      .delete()
      .eq('id', targetId)

    if (error) throw error

    revalidatePath('/admin/targets')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to delete target' }
  }
}

export async function pauseTarget(targetId: string): Promise<ActionResult> {
  return updateTarget({ id: targetId, status: 'suspended' })
}

export async function resumeTarget(targetId: string): Promise<ActionResult> {
  return updateTarget({ id: targetId, status: 'active' })
}
