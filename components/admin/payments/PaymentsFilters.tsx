'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { getResellersForFilter } from '@/app/(admin)/admin/payments/actions'

export default function PaymentsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '')
  const [agingBucket, setAgingBucket] = useState(searchParams.get('aging_bucket') || 'all')
  const [resellerId, setResellerId] = useState(searchParams.get('reseller_id') || '')
  const [resellers, setResellers] = useState<Array<{ id: string; shop_name: string }>>([])

  useEffect(() => {
    const fetchResellers = async () => {
      const result = await getResellersForFilter()
      if (result.ok) setResellers(result.data)
    }
    fetchResellers()
  }, [])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (agingBucket && agingBucket !== 'all') params.set('aging_bucket', agingBucket)
    if (resellerId) params.set('reseller_id', resellerId)
    params.set('page', '1')

    router.push(`/admin/payments?${params.toString()}`)
  }

  const resetFilters = () => {
    setStatus('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setAgingBucket('all')
    setResellerId('')
    router.push('/admin/payments')
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Status */}
        <div className="w-40">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        {/* Search Reseller */}
        <div className="w-48">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Search Reseller</label>
          <select
            value={resellerId}
            onChange={(e) => setResellerId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Resellers</option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.shop_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="w-36">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Date Range</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="w-36">
          <label className="text-xs font-medium text-slate-700 mb-1 block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Aging */}
        <div className="w-40">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Aging</label>
          <select
            value={agingBucket}
            onChange={(e) => setAgingBucket(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All</option>
            <option value="<=30">≤ 30 days</option>
            <option value="31-60">31-60 days</option>
            <option value="61-90">61-90 days</option>
            <option value=">90">&gt; 90 days</option>
          </select>
        </div>

        {/* Apply & Reset */}
        <button
          onClick={applyFilters}
          className="h-10 px-6 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 text-sm"
        >
          Apply
        </button>

        <button
          onClick={resetFilters}
          className="h-10 px-4 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 flex items-center gap-2 text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
