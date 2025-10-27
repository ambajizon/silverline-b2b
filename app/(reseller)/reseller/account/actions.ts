'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { taxInfoSchema, type TaxInfoInput, formatGstNumber, formatPanNumber, formatAadharNumber } from '@/lib/validations/tax-info'

export type ResellerProfile = {
  id: string
  email: string
  role: 'reseller'
  shop_name: string
  contact_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  credit_limit: number | null
  discount_percent: number | null
  extra_charges_percent: number | null
  payment_terms: string | null
  logo_url: string | null
}

export async function getMyProfile(): Promise<ResellerProfile> {
  const supabase = await supabaseServer()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('id', user.id)
    .single()

  // Check role
  if (profile?.role !== 'reseller') {
    redirect('/login')
  }

  // Get or create reseller record
  const { data: reseller } = await supabase
    .from('resellers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // If no reseller record, return empty fields (will be created on first save)
  if (!reseller) {
    return {
      id: user.id,
      email: profile.email ?? user.email ?? '',
      role: 'reseller',
      shop_name: '',
      contact_name: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      pincode: null,
      credit_limit: null,
      discount_percent: null,
      extra_charges_percent: null,
      payment_terms: null,
      logo_url: null,
    }
  }

  return {
    id: user.id,
    email: profile.email ?? user.email ?? '',
    role: 'reseller',
    shop_name: reseller.shop_name ?? '',
    contact_name: reseller.contact_name,
    phone: reseller.phone,
    address: reseller.address,
    city: reseller.city,
    state: reseller.state,
    pincode: reseller.pincode,
    credit_limit: reseller.credit_limit,
    discount_percent: reseller.discount_percent,
    extra_charges_percent: reseller.extra_charges_percent,
    payment_terms: reseller.payment_terms,
    logo_url: reseller.logo_url,
  }
}

export async function updateResellerInfo(input: {
  shop_name: string
  contact_name?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Upsert reseller record
    const { error } = await supabase
      .from('resellers')
      .upsert(
        {
          user_id: user.id,
          shop_name: input.shop_name,
          contact_name: input.contact_name ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          pincode: input.pincode ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/reseller/account')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function updateLogoUrl(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get authenticated user first
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Import supabaseAdmin at the top of file if not already imported
    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    
    // Use service role to bypass RLS for logo update
    const admin = await supabaseAdmin()
    const { error } = await admin
      .from('resellers')
      .update({
        logo_url: url,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Logo update error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/reseller/account')
    return { success: true }
  } catch (error) {
    console.error('Logo update exception:', error)
    return { success: false, error: 'Failed to update logo' }
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()
    
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Sign out
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to change password' }
  }
}

// ============ TAX INFORMATION ============

export type TaxInfo = {
  has_gst: boolean
  gst_number: string | null
  pan_number: string | null
  aadhar_number: string | null
  business_name: string | null
  pan_holder_type: 'individual' | 'proprietorship' | 'partnership' | 'company' | 'trust' | 'huf' | null
  tax_info_verified: boolean
  tax_info_submitted_at: string | null
  tax_info_update_count: number
}

export type TaxUpdateHistory = {
  id: string
  has_gst: boolean | null
  gst_number: string | null
  pan_number: string | null
  aadhar_number: string | null
  business_name: string | null
  pan_holder_type: string | null
  update_type: 'initial_submission' | 'update' | 'admin_correction'
  updated_by_admin: boolean
  admin_notes: string | null
  created_at: string
}

export async function getTaxInfo(): Promise<{ success: boolean; data?: TaxInfo; error?: string }> {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Get reseller record with tax info
    const { data: reseller, error } = await supabase
      .from('resellers')
      .select('has_gst, gst_number, pan_number, aadhar_number, business_name, pan_holder_type, tax_info_verified, tax_info_submitted_at, tax_info_update_count')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!reseller) {
      // Return empty tax info
      return {
        success: true,
        data: {
          has_gst: false,
          gst_number: null,
          pan_number: null,
          aadhar_number: null,
          business_name: null,
          pan_holder_type: null,
          tax_info_verified: false,
          tax_info_submitted_at: null,
          tax_info_update_count: 0,
        },
      }
    }

    return {
      success: true,
      data: {
        has_gst: reseller.has_gst ?? false,
        gst_number: reseller.gst_number,
        pan_number: reseller.pan_number,
        aadhar_number: reseller.aadhar_number,
        business_name: reseller.business_name,
        pan_holder_type: reseller.pan_holder_type as any,
        tax_info_verified: reseller.tax_info_verified ?? false,
        tax_info_submitted_at: reseller.tax_info_submitted_at,
        tax_info_update_count: reseller.tax_info_update_count ?? 0,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch tax information' }
  }
}

export async function saveTaxInfo(input: TaxInfoInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Validate input
    const validated = taxInfoSchema.parse(input)

    // Get current reseller data to check if this is initial submission
    const { data: currentReseller } = await supabase
      .from('resellers')
      .select('id, tax_info_submitted_at, shop_name, contact_name, phone, address, city, state, pincode')
      .eq('user_id', user.id)
      .maybeSingle()

    const isInitialSubmission = !currentReseller?.tax_info_submitted_at

    // Format and clean data
    const gstNumber = validated.has_gst && validated.gst_number 
      ? formatGstNumber(validated.gst_number) 
      : null
    const panNumber = !validated.has_gst && validated.pan_number 
      ? formatPanNumber(validated.pan_number) 
      : null
    const aadharNumber = validated.aadhar_number 
      ? formatAadharNumber(validated.aadhar_number).replace(/\s/g, '') 
      : null

    // Update reseller table - preserve existing shop_name and other fields
    const { error: updateError } = await supabase
      .from('resellers')
      .upsert(
        {
          user_id: user.id,
          shop_name: currentReseller?.shop_name || validated.business_name, // Use existing or fallback to business_name
          contact_name: currentReseller?.contact_name,
          phone: currentReseller?.phone,
          address: currentReseller?.address,
          city: currentReseller?.city,
          state: currentReseller?.state,
          pincode: currentReseller?.pincode,
          has_gst: validated.has_gst,
          gst_number: gstNumber,
          pan_number: panNumber,
          aadhar_number: aadharNumber,
          business_name: validated.business_name,
          pan_holder_type: validated.pan_holder_type,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Get reseller ID for history
    const { data: reseller } = await supabase
      .from('resellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (reseller) {
      // Insert into tax update history
      await supabase
        .from('tax_info_updates')
        .insert({
          reseller_id: reseller.id,
          user_id: user.id,
          has_gst: validated.has_gst,
          gst_number: gstNumber,
          pan_number: panNumber,
          aadhar_number: aadharNumber,
          business_name: validated.business_name,
          pan_holder_type: validated.pan_holder_type,
          update_type: isInitialSubmission ? 'initial_submission' : 'update',
          updated_by_admin: false,
        })
    }

    revalidatePath('/reseller/account')
    return { success: true }
  } catch (error: any) {
    console.error('Save tax info error:', error)
    if (error.name === 'ZodError') {
      return { success: false, error: 'Validation failed. Please check all fields.' }
    }
    return { success: false, error: error.message || 'Failed to save tax information' }
  }
}

export async function getTaxUpdateHistory(): Promise<{ success: boolean; data?: TaxUpdateHistory[]; error?: string }> {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Get reseller ID
    const { data: reseller } = await supabase
      .from('resellers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!reseller) {
      return { success: true, data: [] }
    }

    // Get update history
    const { data: history, error } = await supabase
      .from('tax_info_updates')
      .select('id, has_gst, gst_number, pan_number, aadhar_number, business_name, pan_holder_type, update_type, updated_by_admin, admin_notes, created_at')
      .eq('reseller_id', reseller.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: history as TaxUpdateHistory[],
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch update history' }
  }
}
