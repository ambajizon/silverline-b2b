'use server'

import { supabaseServer } from './supabase-server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function logoutReseller() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}
