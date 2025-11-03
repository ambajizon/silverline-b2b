import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdminLegacy } from '@/lib/supabase-admin'

const RegisterSchema = z.object({
  shop_name: z.string().min(2),
  contact_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.parse(body)

    const admin = supabaseAdminLegacy()

    // 1) Create auth user
    const { data: userData, error: createErr } = await admin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: false,
      user_metadata: { role: 'pending' },
    })
    if (createErr) throw createErr
    const user = userData.user
    if (!user) throw new Error('User creation failed')

    const userId = user.id

    // 2) Insert profile row (role = pending)
    const { error: profileErr } = await admin.from('profiles').insert({ id: userId, email: parsed.email, role: 'pending' })
    if (profileErr && profileErr.code !== '23505') throw profileErr // ignore conflict if exists

    // 3) Insert reseller row
    const { error: resellerErr } = await admin.from('resellers').insert({
      user_id: userId,
      shop_name: parsed.shop_name,
      contact_name: parsed.contact_name ?? null,
      phone: parsed.phone ?? null,
      address: parsed.address ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      pincode: parsed.pincode ?? null,
      status: 'pending',
    })
    if (resellerErr) throw resellerErr

    return NextResponse.json({ ok: true, user_id: userId })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 400 })
  }
}
