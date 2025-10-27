'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { LiveRate, RatePoint, TargetSummary, OrderRow, ResellerProfile } from '@/types/reseller'
import { redirect } from 'next/navigation'

/** 0) auth + role check */
export async function getResellerProfile(): Promise<ResellerProfile> {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // check role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()
  if (error || !profile || profile.role !== 'reseller') redirect('/login')

  // basic reseller info (with status check)
  const { data: reseller } = await supabase
    .from('resellers')
    .select('id, shop_name, status, logo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  // Block access if reseller status is not approved
  if (reseller && reseller.status !== 'approved') {
    redirect('/account-blocked')
  }

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

/** 3) active target for this reseller (nearest deadline) */
export async function getActiveTarget(resellerId: string): Promise<TargetSummary | null> {
  const supabase = await supabaseServer()
  const { data: t } = await supabase
    .from('targets')
    .select('id, name, goal, reward_value, deadline, status')
    .eq('reseller_id', resellerId)
    .eq('status', 'active')
    .order('deadline', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!t) return null

  const { data: prog } = await supabase
    .from('target_progress')
    .select('current_value')
    .eq('target_id', t.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const pct = t.goal ? Math.min(100, Math.round(((prog?.current_value ?? 0) / t.goal) * 100)) : 0
  const daysLeft = Math.max(0, Math.ceil((+new Date(t.deadline) - Date.now()) / (1000 * 60 * 60 * 24)))

  return {
    id: t.id,
    name: t.name,
    goal_value: t.goal ?? 0,
    reward: t.reward_value ? `₹${new Intl.NumberFormat('en-IN').format(Number(t.reward_value))} Bonus` : null,
    progress_pct: pct,
    days_left: daysLeft,
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
