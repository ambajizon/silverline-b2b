'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function TargetsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [qualification, setQualification] = useState(searchParams.get('qualification') || 'any')
  const [resellerId, setResellerId] = useState(searchParams.get('reseller_id') || '')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '')
  const [resellers, setResellers] = useState<Array<{ id: string; shop_name: string }>>([])

  useEffect(() => {
    // Fetch resellers for dropdown
    const fetchResellers = async () => {
      const supabase = supabaseBrowser()
      const { data } = await supabase
        .from('resellers')
        .select('id, shop_name')
        .eq('status', 'approved')
        .order('shop_name')

      if (data) setResellers(data)
    }
    fetchResellers()
  }, [])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    if (qualification && qualification !== 'any') params.set('qualification', qualification)
    if (resellerId) params.set('reseller_id', resellerId)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    params.set('page', '1')

    router.push(`/admin/targets?${params.toString()}`)
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setType('')
    setQualification('any')
    setResellerId('')
    setDateFrom('')
    setDateTo('')
    router.push('/admin/targets')
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
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Type */}
        <div className="w-40">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Types</option>
            <option value="purchase_value">Purchase Value</option>
            <option value="weight">Weight</option>
            <option value="order_count">Order Count</option>
            <option value="category_specific">Category Specific</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>

        {/* Reseller */}
        <div className="w-48">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Reseller</label>
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

        {/* Qualification */}
        <div className="w-40">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Qualification</label>
          <select
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="any">Any</option>
            <option value="qualified">Qualified</option>
            <option value="not_qualified">Not Qualified</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="w-36">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Deadline From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="w-36">
          <label className="text-xs font-medium text-slate-700 mb-1 block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-700 mb-1 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search targets, resellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full h-10 pl-10 pr-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="h-10 px-4 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 flex items-center gap-2 text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  )
}
