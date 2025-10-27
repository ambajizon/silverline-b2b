import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}

export async function GET() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}
