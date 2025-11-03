'use server'

import { supabaseServer } from '@/lib/supabase-server'

type ActionResult =
  | { ok: true; data?: any }
  | { ok: false; error: string }

async function verifyReseller() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase, resellerId: null }

  const { data: reseller } = await supabase
    .from('resellers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!reseller) return { authorized: false, supabase, resellerId: null }
  return { authorized: true, supabase, resellerId: reseller.id }
}

// Get reseller's qualified targets and rewards
export async function getResellerRewards(): Promise<ActionResult> {
  try {
    const { authorized, supabase, resellerId } = await verifyReseller()
    if (!authorized || !resellerId) return { ok: false, error: 'Unauthorized' }

    const { data: targets, error } = await supabase
      .from('targets')
      .select('*')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate progress for each target
    const targetsWithProgress = await Promise.all(
      (targets || []).map(async (t: any) => {
        let currentProgress = 0
        let goalDisplay = ''
        let achievedDisplay = ''
        
        const { data: deliveredOrders } = await supabase
          .from('orders')
          .select('id, total_weight_kg, total_price')
          .eq('reseller_id', resellerId)
          .eq('status', 'delivered')
          .gte('created_at', t.created_at)
          .lte('created_at', t.deadline)
        
        if (deliveredOrders && deliveredOrders.length > 0) {
          const { data: outstandingData } = await supabase
            .from('v_reseller_outstanding')
            .select('outstanding')
            .eq('reseller_id', resellerId)
            .maybeSingle()
          
          const resellerOutstanding = Number(outstandingData?.outstanding || 0)
          
          if (resellerOutstanding <= 0) {
            if (t.type === 'weight') {
              currentProgress = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total_weight_kg || 0), 0)
              goalDisplay = `${t.goal} kg`
              achievedDisplay = `${currentProgress.toFixed(2)} kg`
            } else if (t.type === 'purchase_value' || t.type === 'revenue') {
              currentProgress = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0)
              goalDisplay = `₹${t.goal.toLocaleString()}`
              achievedDisplay = `₹${currentProgress.toLocaleString()}`
            } else if (t.type === 'order_count') {
              currentProgress = deliveredOrders.length
              goalDisplay = `${t.goal} orders`
              achievedDisplay = `${currentProgress} orders`
            }
          }
        }
        
        const isQualified = currentProgress >= t.goal
        const progressPercentage = t.goal > 0 ? Math.min(100, Math.round((currentProgress / t.goal) * 100)) : 0
        
        return {
          id: t.id,
          name: t.name,
          type: t.type,
          goal: t.goal,
          goal_display: goalDisplay,
          achieved: currentProgress,
          achieved_display: achievedDisplay,
          is_qualified: isQualified,
          progress_percentage: progressPercentage,
          reward_status: t.reward_status || 'pending',
          reward_approved_date: t.reward_approved_date,
          reward_delivered_date: t.reward_delivered_date,
          created_at: t.created_at,
          deadline: t.deadline,
          status: t.status,
        }
      })
    )

    // Separate qualified and unqualified
    const qualified = targetsWithProgress.filter(t => t.is_qualified)
    const inProgress = targetsWithProgress.filter(t => !t.is_qualified && t.status === 'active')
    
    return {
      ok: true,
      data: {
        qualified,
        inProgress,
        all: targetsWithProgress,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch rewards' }
  }
}
