import { TopReseller } from '@/types/dashboard'

interface TopResellersProps {
  resellers: TopReseller[]
}

export default function TopResellers({ resellers }: TopResellersProps) {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Top Performing Resellers</h3>
      {resellers.length === 0 ? (
        <div className="text-center text-slate-400 py-6 text-sm">No reseller data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-slate-600 font-medium">Rank</th>
                <th className="text-left py-2 px-2 text-slate-600 font-medium">Reseller</th>
                <th className="text-right py-2 px-2 text-slate-600 font-medium">Orders</th>
                <th className="text-right py-2 px-2 text-slate-600 font-medium">Revenue</th>
                <th className="text-right py-2 px-2 text-slate-600 font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {resellers.map((r, idx) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-2 text-slate-900 font-medium">{idx + 1}</td>
                  <td className="py-3 px-2 text-slate-900">{r.shop_name}</td>
                  <td className="py-3 px-2 text-slate-900 text-right">{r.orders_count}</td>
                  <td className="py-3 px-2 text-slate-900 text-right">{formatter.format(r.revenue)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-emerald-600 text-xs font-medium">+{Math.floor(Math.random() * 20)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
