'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/roles'
import { OrderStatus } from '@/types/orders'
import type { PaymentStatus } from '@/types/order'

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    
    if (!isAdmin(profile?.role)) return { success: false, error: 'Forbidden' }

    // Update order
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    }
    if (notes !== undefined) updateData.notes = notes

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) throw error

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update order' }
  }
}

export async function getAllOrders(filters?: {
  status?: OrderStatus
  payment_status?: PaymentStatus
  resellerId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  perPage?: number
}): Promise<{ orders: any[]; total: number }> {
  const supabase = await supabaseServer()

  let q = supabase
    .from('orders')
    .select('*, resellers(shop_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.payment_status) q = q.eq('payment_status', filters.payment_status)
  if (filters?.resellerId) q = q.eq('reseller_id', filters.resellerId)
  if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom)
  if (filters?.dateTo) q = q.lte('created_at', filters.dateTo)
  if (filters?.search) q = q.or(`order_code.ilike.%${filters.search}%,resellers.shop_name.ilike.%${filters.search}%`)

  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count } = await q.range(from, to)

  return { orders: data ?? [], total: count ?? 0 }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (!isAdmin(profile?.role)) return { success: false, error: 'Forbidden' }

    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) throw error
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to update payment status' }
  }
}

// Note: Shipping details are stored in the 'notes' field, not separate columns.
// Use updateOrderStatus() with notes parameter to update shipping information.
