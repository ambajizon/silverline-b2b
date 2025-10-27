'use server'

import { supabaseServer } from '@/lib/supabase-server'

type ShippingAddress = {
  full_name: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
}

export async function saveShippingAddress(shipping: ShippingAddress) {
  const supabase = await supabaseServer()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Update reseller shipping info
  const { error } = await supabase
    .from('resellers')
    .update({
      shop_name: shipping.full_name,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      pincode: shipping.pincode,
      phone: shipping.phone,
    })
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to save address: ${error.message}`)
  }

  return { success: true }
}
