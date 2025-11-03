import { SalesKPIs } from '@/types/reports'

interface KpiRowProps {
  kpis: SalesKPIs
}

export default function KpiRow({ kpis }: KpiRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <p className="text-sm text-blue-600 mb-1">Total Revenue</p>
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(kpis.total_revenue)}</p>
      </div>

      {/* Total Orders */}
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <p className="text-sm text-slate-600 mb-1">Total Orders</p>
        <p className="text-3xl font-bold text-slate-900">{kpis.total_orders}</p>
      </div>

      {/* Average Order Value */}
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <p className="text-sm text-slate-600 mb-1">Average Order Value</p>
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(kpis.average_order_value)}</p>
      </div>

      {/* Total Quantity Sold */}
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <p className="text-sm text-slate-600 mb-1">Total Quantity Sold</p>
        <p className="text-3xl font-bold text-slate-900">{kpis.total_quantity_kg} kg</p>
      </div>
    </div>
  )
}
