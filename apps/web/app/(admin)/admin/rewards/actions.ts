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

// Get qualified resellers (from targets)
export async function getQualifiedResellers(filters: {
  status?: string
  page?: number
} = {}): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Get all qualified targets with reseller info
    let query = supabase
      .from('targets')
      .select(`
        id,
        reseller_id,
        name,
        type,
        goal,
        created_at,
        deadline,
        reward_status,
        reward_approved_date,
        reward_delivered_date,
        resellers(shop_name, phone, profiles(email))
      `)
      .eq('status', 'active')
    
    if (filters.status) {
      query = query.eq('reward_status', filters.status)
    }

    const { data: targets, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    // Calculate progress for each target to verify qualification
    const qualifiedTargets = await Promise.all(
      (targets || []).map(async (t: any) => {
        let currentProgress = 0
        let goalDisplay = ''
        let achievedDisplay = ''
        
        if (t.reseller_id) {
          const { data: deliveredOrders } = await supabase
            .from('orders')
            .select('id, total_weight_kg, total_price')
            .eq('reseller_id', t.reseller_id)
            .eq('status', 'delivered')
            .gte('created_at', t.created_at)
            .lte('created_at', t.deadline)
          
          if (deliveredOrders && deliveredOrders.length > 0) {
            const { data: outstandingData } = await supabase
              .from('v_reseller_outstanding')
              .select('outstanding')
              .eq('reseller_id', t.reseller_id)
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
        }
        
        const isQualified = currentProgress >= t.goal
        
        return {
          target_id: t.id,
          target_name: t.name,
          reseller_id: t.reseller_id,
          reseller_name: t.resellers?.shop_name || 'Unknown',
          reseller_email: t.resellers?.profiles?.email || '',
          reseller_phone: t.resellers?.phone || '',
          goal: t.goal,
          goal_display: goalDisplay,
          achieved: currentProgress,
          achieved_display: achievedDisplay,
          is_qualified: isQualified,
          reward_status: t.reward_status || 'pending',
          reward_approved_date: t.reward_approved_date,
          reward_delivered_date: t.reward_delivered_date,
          deadline: t.deadline,
        }
      })
    )

    // Filter only qualified targets
    const filtered = qualifiedTargets.filter(t => t.is_qualified)

    return {
      ok: true,
      data: {
        qualified: filtered,
        total: filtered.length,
      },
    }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch qualified resellers' }
  }
}

// Get rewards history (delivered rewards)
export async function getRewardsHistory(): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('targets')
      .select(`
        id,
        reseller_id,
        name,
        type,
        goal,
        reward_delivered_date,
        resellers(shop_name)
      `)
      .eq('reward_status', 'delivered')
      .not('reward_delivered_date', 'is', null)
      .order('reward_delivered_date', { ascending: false })

    if (error) throw error

    const history = (data || []).map((t: any) => {
      let goalDisplay = ''
      let achievedDisplay = t.goal

      if (t.type === 'weight') {
        goalDisplay = `${t.goal} kg`
        achievedDisplay = `${t.goal} kg`
      } else if (t.type === 'purchase_value' || t.type === 'revenue') {
        goalDisplay = `₹${t.goal.toLocaleString()}`
        achievedDisplay = `₹${t.goal.toLocaleString()}`
      } else if (t.type === 'order_count') {
        goalDisplay = `${t.goal} orders`
        achievedDisplay = `${t.goal} orders`
      }

      return {
        target_id: t.id,
        target_name: t.name,
        reseller_name: t.resellers?.shop_name || 'Unknown',
        goal_display: goalDisplay,
        achieved_display: achievedDisplay,
        delivered_date: t.reward_delivered_date,
      }
    })

    return { ok: true, data: history }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch rewards history' }
  }
}

// Approve reward for qualified target
export async function approveReward(targetId: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('targets')
      .update({
        reward_status: 'approved',
        reward_approved_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', targetId)

    if (error) throw error

    revalidatePath('/admin/rewards')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to approve reward' }
  }
}

// Mark reward as delivered
export async function markRewardDelivered(targetId: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('targets')
      .update({
        reward_status: 'delivered',
        reward_delivered_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', targetId)

    if (error) throw error

    revalidatePath('/admin/rewards')
    revalidatePath('/reseller/rewards')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to mark as delivered' }
  }
}

