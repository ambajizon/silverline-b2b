'use server'

import { supabaseServer } from '@/lib/supabase-server'

type ActionResult =
  | { ok: true; data?: any }
  | { ok: false; error: string }

async function getResellerUser() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase, resellerId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, resellers(id)')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'reseller' || !profile.resellers?.[0]?.id) {
    return { authorized: false, supabase, resellerId: null }
  }

  return { authorized: true, supabase, resellerId: profile.resellers[0].id }
}

export async function getResellerTargets(): Promise<ActionResult> {
  try {
    const { authorized, supabase, resellerId } = await getResellerUser()
    if (!authorized || !resellerId) return { ok: false, error: 'Unauthorized' }

    // Try RPC first
    const { data, error } = await supabase.rpc('get_reseller_targets', {
      p_reseller_id: resellerId,
    })

    if (error) {
      // Fallback to direct query
      const { data: targets } = await supabase
        .from('targets')
        .select(`
          *,
          target_progress(current_value)
        `)
        .or(`reseller_id.eq.${resellerId},open_participation.eq.true`)
        .in('status', ['active', 'in_progress'])
        .order('deadline', { ascending: true })

      if (!targets) throw new Error('Failed to fetch targets')

      const transformedTargets = targets.map((t: any) => {
        const currentProgress = t.target_progress?.reduce(
          (sum: number, p: any) => sum + (p.current_value || 0),
          0
        ) || 0
        return {
          ...t,
          current_progress: currentProgress,
          progress_percentage: Math.min(100, (currentProgress / t.goal) * 100),
          is_qualified: currentProgress >= t.goal,
        }
      })

      return { ok: true, data: transformedTargets }
    }

    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch targets' }
  }
}

export async function getResellerTargetDetail(targetId: string): Promise<ActionResult> {
  try {
    const { authorized, supabase, resellerId } = await getResellerUser()
    if (!authorized || !resellerId) return { ok: false, error: 'Unauthorized' }

    const { data: target } = await supabase
      .from('targets')
      .select(`
        *,
        target_progress(*)
      `)
      .eq('id', targetId)
      .or(`reseller_id.eq.${resellerId},open_participation.eq.true`)
      .single()

    if (!target) throw new Error('Target not found or access denied')

    const progressHistory = target.target_progress || []
    const currentProgress = progressHistory.reduce(
      (sum: number, p: any) => sum + (p.delta_value || 0),
      0
    )

    return {
      ok: true,
      data: {
        ...target,
        current_progress: currentProgress,
        progress_percentage: Math.min(100, (currentProgress / target.goal) * 100),
        is_qualified: currentProgress >= target.goal,
        progress_history: progressHistory,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch target detail' }
  }
}
