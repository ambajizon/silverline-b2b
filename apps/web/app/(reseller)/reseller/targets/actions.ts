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

    // Get all targets for this reseller with reward status
    const { data: targets } = await supabase
      .from('targets')
      .select(`
        *,
        reward_status,
        reward_approved_date,
        reward_delivered_date
      `)
      .eq('reseller_id', resellerId)
      .in('status', ['active'])
      .order('deadline', { ascending: true })

    if (!targets) throw new Error('Failed to fetch targets')

    // Calculate progress for each target (payment-aware)
    const transformedTargets = await Promise.all(
      targets.map(async (t: any) => {
        let currentProgress = 0
        
        // Get ALL delivered orders for this reseller (not just within target period)
        // This ensures we count all qualified orders
        const { data: deliveredOrders } = await supabase
          .from('orders')
          .select('id, total_weight_kg, total_price, created_at')
          .eq('reseller_id', resellerId)
          .eq('status', 'delivered')
        
        if (deliveredOrders && deliveredOrders.length > 0) {
          // Check reseller's overall outstanding
          const { data: outstandingData } = await supabase
            .from('v_reseller_outstanding')
            .select('outstanding')
            .eq('reseller_id', resellerId)
            .maybeSingle()
          
          const resellerOutstanding = Number(outstandingData?.outstanding || 0)
          
          // Filter orders within target period
          const ordersInPeriod = deliveredOrders.filter((order: any) => {
            const orderDate = new Date(order.created_at)
            const targetStart = new Date(t.created_at)
            const targetEnd = new Date(t.deadline)
            const inPeriod = orderDate >= targetStart && orderDate <= targetEnd
            
            return inPeriod
          })
          
          // If no outstanding, count all delivered orders in period
          if (resellerOutstanding <= 0 && ordersInPeriod.length > 0) {
            if (t.type === 'weight') {
              currentProgress = ordersInPeriod.reduce((sum: number, o: any) => sum + Number(o.total_weight_kg || 0), 0)
            } else if (t.type === 'purchase_value' || t.type === 'revenue') {
              currentProgress = ordersInPeriod.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0)
            } else if (t.type === 'order_count') {
              currentProgress = ordersInPeriod.length
            }
          }
        }
        
        return {
          ...t,
          current_progress: currentProgress,
          progress_percentage: Math.min(100, Math.round((currentProgress / t.goal) * 100)),
          is_qualified: currentProgress >= t.goal,
        }
      })
    )

    return { ok: true, data: { targets: transformedTargets, resellerId } }
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
