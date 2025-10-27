'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ReportFilters } from '@/types/reports'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface FilterBarProps {
  filters: ReportFilters
}

export default function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState(filters.date_range)
  const [reportType, setReportType] = useState(filters.report_type)
  const [resellerId, setResellerId] = useState(filters.reseller_id || '')
  const [dateFrom, setDateFrom] = useState(filters.date_from || '')
  const [dateTo, setDateTo] = useState(filters.date_to || '')
  const [resellers, setResellers] = useState<Array<{ id: string; shop_name: string }>>([])

  useEffect(() => {
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

  const handleGenerateReport = () => {
    const params = new URLSearchParams()
    params.set('date_range', dateRange)
    if (dateRange === 'custom' && dateFrom && dateTo) {
      params.set('date_from', dateFrom)
      params.set('date_to', dateTo)
    }
    if (reportType && reportType !== 'all') params.set('report_type', reportType)
    if (resellerId) params.set('reseller_id', resellerId)

    router.push(`/admin/reports?${params.toString()}`)
  }

  const handleReset = () => {
    setDateRange('30d')
    setReportType('all')
    setResellerId('')
    setDateFrom('')
    setDateTo('')
    router.push('/admin/reports')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </>
        )}

        {/* Report Type */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All</option>
            <option value="sales">Sales</option>
            <option value="product_performance">Product Performance</option>
            <option value="reseller_activity">Reseller Activity</option>
            <option value="payments">Payments</option>
            <option value="targets">Targets</option>
          </select>
        </div>

        {/* Reseller */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Reseller</label>
          <select
            value={resellerId}
            onChange={(e) => setResellerId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Search reseller...</option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.shop_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerateReport}
          className="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-medium"
        >
          Generate Report
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300 font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
