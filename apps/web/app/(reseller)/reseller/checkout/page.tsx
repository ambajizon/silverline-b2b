import { supabaseServer } from '@/lib/supabase-server'
import CheckoutForm from '@/components/reseller/CheckoutForm'
import { redirect } from 'next/navigation'

export default async function CheckoutPage() {
  const supabase = await supabaseServer()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // Get reseller shipping info
  const { data: reseller } = await supabase
    .from('resellers')
    .select('shop_name, address, city, state, pincode, phone')
    .eq('user_id', user.id)
    .maybeSingle()

  const defaultShipping = {
    full_name: reseller?.shop_name ?? '',
    address: reseller?.address ?? '',
    city: reseller?.city ?? '',
    state: reseller?.state ?? '',
    pincode: reseller?.pincode ?? '',
    phone: reseller?.phone ?? '',
  }

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Checkout</h1>
      
      <CheckoutForm defaultShipping={defaultShipping} />
    </div>
  )
}
