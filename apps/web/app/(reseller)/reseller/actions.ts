'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { LiveRate, RatePoint, TargetSummary, OrderRow, ResellerProfile } from '@/types/reseller'
import { redirect } from 'next/navigation'

/** 0) auth + role check */
export async function getResellerProfile(): Promise<ResellerProfile> {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('🔴 Reseller Auth Failed: No authenticated user')
    redirect('/login')
  }

  // check role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('🔴 Reseller Auth Failed: Profile fetch error:', error.message)
    redirect('/login')
  }
  
  if (!profile) {
    console.error('🔴 Reseller Auth Failed: No profile found for user:', user.id)
    redirect('/login')
  }
  
  if (profile.role !== 'reseller') {
    console.error('🔴 Reseller Auth Failed: Wrong role. Expected: "reseller", Got:', profile.role)
    console.error('👉 Fix: Run this SQL: UPDATE profiles SET role = \'reseller\' WHERE id = \'' + user.id + '\';')
    redirect('/login')
  }

  // basic reseller info (with status check)
  const { data: reseller } = await supabase
    .from('resellers')
    .select('id, shop_name, status, logo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  // Block access if reseller status is not approved
  if (reseller && reseller.status !== 'approved') {
    console.error('🔴 Reseller Blocked: Status is "' + reseller.status + '", needs to be "approved"')
    console.error('👉 Fix: Run this SQL: UPDATE resellers SET status = \'approved\' WHERE user_id = \'' + user.id + '\';')
    redirect('/account-blocked')
  }
  
  if (!reseller) {
    console.error('⚠️ Warning: No reseller record found for user:', user.id)
    console.error('👉 Fix: Create reseller record in admin panel or run: INSERT INTO resellers (user_id, shop_name, status) VALUES (\'' + user.id + '\', \'Shop Name\', \'approved\');')
  }

  console.log('✅ Reseller authenticated successfully:', reseller?.shop_name || user.id)

  return {
    id: reseller?.id ?? user.id,
    first_name: reseller?.shop_name ?? null,
    human_code: (reseller?.id ?? user.id).slice(0, 8).toUpperCase(),
    shop_name: reseller?.shop_name ?? null,
    logo_url: reseller?.logo_url ?? null,
  }
}

/** 1) live rate with 24h change */
export async function getLiveRate(): Promise<LiveRate> {
  const supabase = await supabaseServer()

  // latest
  const { data: latest } = await supabase
    .from('silver_rates')
    .select('rate_per_gram, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 24h ago
  const since = new Date()
  since.setDate(since.getDate() - 1)
  const { data: ago } = await supabase
    .from('silver_rates')
    .select('rate_per_gram')
    .lte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const rate = latest?.rate_per_gram ?? 0
  const base = ago?.rate_per_gram ?? null
  const change = base ? ((rate - base) / base) * 100 : null

  return {
    rate_per_gram: rate,
    updated_at: latest?.created_at ?? new Date().toISOString(),
    change_24h_pct: change,
  }
}

// Convenience wrapper to fetch current rate only
export async function getCurrentRate(): Promise<number> {
  const live = await getLiveRate()
  return Number(live.rate_per_gram || 0)
}

/** 2) 7-day trend (one point/day, choose the max per day) */
export async function getRateTrend7d(): Promise<RatePoint[]> {
  const supabase = await supabaseServer()
  const start = new Date()
  start.setDate(start.getDate() - 7)

  const { data } = await supabase
    .from('silver_rates')
    .select('rate_per_gram, created_at')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true })

  if (!data?.length) return []
  // reduce to one point per day (last of each day)
  const byDay = new Map<string, RatePoint>()
  for (const r of data) {
    const day = new Date(r.created_at).toISOString().slice(0, 10)
    byDay.set(day, { ts: r.created_at, rate: r.rate_per_gram })
  }
  return Array.from(byDay.values())
}

/** 3) active target for this reseller (nearest deadline) with payment-aware progress */
export async function getActiveTarget(resellerId: string): Promise<TargetSummary | null> {
  const supabase = await supabaseServer()
  const { data: t } = await supabase
    .from('targets')
    .select(`
      id, 
      name, 
      goal, 
      type,
      reward_value, 
      deadline, 
      status,
      created_at,
      reward_status,
      reward_approved_date,
      reward_delivered_date
    `)
    .eq('reseller_id', resellerId)
    .eq('status', 'active')
    .order('deadline', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!t) return null

  // Calculate payment-aware progress
  let currentProgress = 0
  
  // Get delivered orders within target period
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
      return orderDate >= targetStart && orderDate <= targetEnd
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

  const pct = t.goal ? Math.min(100, Math.round((currentProgress / t.goal) * 100)) : 0
  const daysLeft = Math.max(0, Math.ceil((+new Date(t.deadline) - Date.now()) / (1000 * 60 * 60 * 24)))
  const isQualified = currentProgress >= t.goal

  return {
    id: t.id,
    name: t.name,
    goal_value: t.goal ?? 0,
    reward: t.reward_value ? `₹${new Intl.NumberFormat('en-IN').format(Number(t.reward_value))} Bonus` : null,
    progress_pct: pct,
    days_left: daysLeft,
    is_qualified: isQualified,
    reward_status: t.reward_status || 'pending',
    reward_approved_date: t.reward_approved_date,
    reward_delivered_date: t.reward_delivered_date,
  }
}

/** 4) recent orders (limit 5) */
export async function getRecentOrders(resellerId: string, limit = 5): Promise<OrderRow[]> {
  const supabase = await supabaseServer()
  const { data } = await supabase
    .from('orders')
    .select('id, created_at, status, total_price')
    .eq('reseller_id', resellerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(o => ({
    id: o.id,
    order_code: 'SL-' + o.id.slice(0, 4).toUpperCase(),
    created_at: o.created_at,
    total_amount: Number(o.total_price ?? 0),
    status: o.status as OrderRow['status'],
  }))
}
