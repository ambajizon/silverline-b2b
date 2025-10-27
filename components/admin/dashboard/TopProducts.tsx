import { TopProduct } from '@/types/dashboard'

interface TopProductsProps {
  products: TopProduct[]
}

export default function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Top Selling Products</h3>
      {products.length === 0 ? (
        <div className="text-center text-slate-400 py-6 text-sm">No product data available</div>
      ) : (
        <div className="space-y-3">
          {products.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-medium">{p.name}</span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Best Seller</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.units} orders | {p.lines_count} line items</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{p.units}</p>
                <p className="text-xs text-slate-500">units</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
