'use server'

import { supabaseServer } from '@/lib/supabase-server'

export type SupportContact = {
  name: string
  email: string
  phone: string
}

export async function getSupportContact(): Promise<SupportContact> {
  try {
    const supabase = await supabaseServer()
    
    // Get support contact from settings table
    const { data: settings } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'support_contact')
      .maybeSingle()

    if (settings?.setting_value) {
      const contact = settings.setting_value as SupportContact
      return contact
    }

    // Default support contact if not configured
    return {
      name: 'Support Team',
      email: 'support@gujaratjewellery.com',
      phone: '+91 98765 43210',
    }
  } catch (error) {
    console.error('Failed to fetch support contact:', error)
    // Return default on error
    return {
      name: 'Support Team',
      email: 'support@gujaratjewellery.com',
      phone: '+91 98765 43210',
    }
  }
}
