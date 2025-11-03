import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase-server'

export default async function ResellersReportPage() {
  const supabase = await supabaseServer()

  // Get reseller summary with their orders
  const { data: resellers, error } = await supabase
    .from('resellers')
    .select(`
      id,
      shop_name,
      contact_name,
      phone,
      created_at
    `)
    .order('created_at', { ascending: false })

  // Get order counts for each reseller
  const resellersWithStats = await Promise.all(
    (resellers || []).map(async (reseller) => {
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('reseller_id', reseller.id)

      const { count: deliveredOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('reseller_id', reseller.id)
        .eq('status', 'delivered')

      const { data: orders } = await supabase
        .from('orders')
        .select('total_price')
        .eq('reseller_id', reseller.id)
        .eq('status', 'delivered')

      const totalRevenue = orders?.reduce((sum, o) => sum + o.total_price, 0) || 0

      return {
        ...reseller,
        totalOrders: totalOrders || 0,
        deliveredOrders: deliveredOrders || 0,
        totalRevenue,
      }
    })
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/reports"
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reseller Activity</h1>
        <p className="text-sm text-slate-600">Monitor reseller performance and engagement</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Total Resellers</p>
          <p className="text-2xl font-bold text-slate-900">{resellersWithStats.length}</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Active Resellers</p>
          <p className="text-2xl font-bold text-slate-900">
            {resellersWithStats.filter((r) => r.totalOrders > 0).length}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(resellersWithStats.reduce((sum, r) => sum + r.totalRevenue, 0))}
          </p>
        </div>
      </div>

      {/* Resellers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Reseller Performance</h2>
          <p className="text-xs text-slate-600">Complete list of all resellers and their activity</p>
        </div>

        {resellersWithStats.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">No resellers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Shop Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Contact</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-700">Total Orders</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-700">Delivered</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Revenue</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resellersWithStats.map((reseller) => (
                  <tr key={reseller.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{reseller.shop_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      <div>{reseller.contact_name}</div>
                      <div className="text-xs text-slate-500">{reseller.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-slate-900">{reseller.totalOrders}</td>
                    <td className="py-3 px-4 text-sm text-center text-slate-900">{reseller.deliveredOrders}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900">
                      {formatCurrency(reseller.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatDate(reseller.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
