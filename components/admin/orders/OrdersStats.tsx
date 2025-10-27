import { OrderStats } from '@/types/orders'
import { Package, Clock, Truck } from 'lucide-react'

interface OrdersStatsProps {
  stats: OrderStats
}

export default function OrdersStats({ stats }: OrdersStatsProps) {
  return (
    <div className="space-y-4">
      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">New Orders</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.new_orders}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Pending</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-yellow-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Dispatched</p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.dispatched}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Pipeline */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Order Pipeline</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
              Pending {stats.pipeline?.pending || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full">
              Processing {stats.pipeline?.processing || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-cyan-700 bg-cyan-100 px-3 py-1.5 rounded-full">
              Shipped {stats.pipeline?.shipped || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              Delivered {stats.pipeline?.delivered || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
              Cancelled {stats.pipeline?.cancelled || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
