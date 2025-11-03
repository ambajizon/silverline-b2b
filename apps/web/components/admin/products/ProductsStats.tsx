import { ProductStats } from '@/types/products'

interface ProductsStatsProps {
  stats: ProductStats
}

export default function ProductsStats({ stats }: ProductsStatsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-700">Active Products</span>
          <span className="text-2xl font-bold text-blue-900">{stats.active}</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-yellow-700">With Offers</span>
          <span className="text-2xl font-bold text-yellow-900">{stats.with_offers}</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-red-700">Low Stock</span>
          <span className="text-2xl font-bold text-red-900">{stats.low_stock}</span>
        </div>
      </div>
    </div>
  )
}
