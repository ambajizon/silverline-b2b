'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { OrderListItem, OrderStatus } from '@/types/reseller'

interface OrdersListProps {
  orders: OrderListItem[]
  total: number
  kpis: {
    all: number
    pending: number
    dispatched: number
    delivered: number
    cancelled: number
  }
  currentPage: number
  currentStatus?: OrderStatus
  currentSearch?: string
}

const statusColors = {
  pending: 'bg-slate-50 text-slate-700 border-slate-200',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  in_making: 'bg-amber-50 text-amber-700 border-amber-200',
  dispatched: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_making: 'In Making',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

const tabs = [
  { key: null, label: 'All', kpiKey: 'all' },
  { key: 'pending', label: 'Pending', kpiKey: 'pending' },
  { key: 'dispatched', label: 'Dispatched', kpiKey: 'dispatched' },
  { key: 'delivered', label: 'Delivered', kpiKey: 'delivered' },
  { key: 'cancelled', label: 'Cancelled', kpiKey: 'cancelled' },
] as const

export default function OrdersList({
  orders,
  total,
  kpis,
  currentPage,
  currentStatus,
  currentSearch,
}: OrdersListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch ?? '')

  const handleTabClick = (status: OrderStatus | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    params.delete('page')
    router.push(`/reseller/orders?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput) {
      params.set('search', searchInput)
    } else {
      params.delete('search')
    }
    params.delete('page')
    router.push(`/reseller/orders?${params.toString()}`)
  }

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.key
          const count = kpis[tab.kpiKey as keyof typeof kpis]
          
          return (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab.key as OrderStatus | null)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 text-center">
          <p className="text-sm text-slate-500 mb-2">No orders found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/reseller/orders/${order.id}`}
              className="block bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">#{order.order_number}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { 
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium border ${
                    statusColors[order.status as keyof typeof statusColors] ?? statusColors.pending
                  }`}
                >
                  {statusLabels[order.status as keyof typeof statusLabels] ?? 'Pending'}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div>
                  <p className="text-slate-500">Items</p>
                  <p className="font-medium text-slate-900">{order.item_count}</p>
                </div>
                <div>
                  <p className="text-slate-500">Weight</p>
                  <p className="font-medium text-slate-900">{order.total_weight.toFixed(2)}kg</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Amount</p>
                  <p className="font-semibold text-blue-600">{formatINR(order.total_amount)}</p>
                </div>
              </div>

              {/* View Details CTA */}
              <div className="text-xs text-blue-600 font-medium">View Details →</div>
            </Link>
          ))}
        </div>
      )}

      {/* Results Count */}
      {orders.length > 0 && (
        <p className="text-xs text-center text-slate-500">
          Showing {orders.length} of {total} orders
        </p>
      )}
    </div>
  )
}
