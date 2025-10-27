import { supabaseServer } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ResellerProfileCard from '@/components/admin/resellers/ResellerProfileCard'
import ResellerFinancialDetails from '@/components/admin/resellers/ResellerFinancialDetails'
import ResellerTaxInfo from '@/components/admin/resellers/ResellerTaxInfo'
import ResellerOrderHistory from '@/components/admin/resellers/ResellerOrderHistory'
import ResellerTargets from '@/components/admin/resellers/ResellerTargets'

async function fetchResellerDetail(resellerId: string) {
  const supabase = await supabaseServer()

  try {
    // Fetch reseller with profile (includes tax info)
    const { data: reseller, error: resellerError } = await supabase
      .from('resellers')
      .select(`
        *,
        profiles!inner(email)
      `)
      .eq('id', resellerId)
      .single()

    if (resellerError || !reseller) return null

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_code, total_price, total_weight_kg, status, payment_status, created_at')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate current outstanding
    const { data: orderTotals } = await supabase
      .from('orders')
      .select('total_price')
      .eq('reseller_id', resellerId)
      .in('status', ['pending', 'accepted', 'in_making', 'dispatched'])

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('reseller_id', resellerId)
      .eq('status', 'completed')

    const totalOrders = (orderTotals || []).reduce((sum, o) => sum + Number(o.total_price || 0), 0)
    const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const currentOutstanding = totalOrders - totalPaid

    // Fetch targets with progress
    const { data: targets } = await supabase
      .from('targets')
      .select(`
        *,
        target_progress(current_value)
      `)
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })

    return {
      reseller: {
        ...reseller,
        email: reseller.profiles?.email || '',
        current_outstanding: currentOutstanding,
      },
      orders: orders || [],
      targets: (targets || []).map((t: any) => ({
        ...t,
        current_progress: t.target_progress?.[0]?.current_value || 0,
      })),
    }
  } catch (error) {
    console.error('Failed to fetch reseller detail:', error)
    return null
  }
}

export default async function ResellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchResellerDetail(id)

  if (!data) {
    notFound()
  }

  const { reseller, orders, targets } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/resellers" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reseller: {reseller.shop_name}</h1>
          <Link href="/admin/resellers" className="text-sm text-blue-600 hover:underline">
            ← Back to Resellers
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <ResellerProfileCard reseller={reseller} />
          <ResellerFinancialDetails reseller={reseller} />
          <ResellerTaxInfo reseller={reseller} />
          <ResellerOrderHistory orders={orders} resellerId={id} />
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          <ResellerTargets targets={targets} resellerId={id} />
        </div>
      </div>
    </div>
  )
}
