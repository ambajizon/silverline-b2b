import { supabaseServer } from '@/lib/supabase-server'
import { ResellerFilters, ResellerStats, ResellerWithProfile } from '@/types/resellers'
import ResellersFilters from '@/components/admin/resellers/ResellersFilters'
import ResellersStats from '@/components/admin/resellers/ResellersStats'
import ResellersTable from '@/components/admin/resellers/ResellersTable'
import { FileDown, Plus } from 'lucide-react'

async function fetchResellersData(filters: ResellerFilters) {
  const supabase = await supabaseServer()
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  try {
    // Build query (exclude admin)
    let query = supabase
      .from('resellers')
      .select(`
        *,
        profiles!inner(email, role)
      `, { count: 'exact' })
      .neq('profiles.role', 'admin')

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.search) {
      query = query.or(`shop_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Execute with pagination
    const { data: resellersData, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Transform data
    const resellers: ResellerWithProfile[] = (resellersData || []).map((r: any) => ({
      ...r,
      email: r.profiles?.email || 'N/A',
    }))

    // Fetch stats (exclude admin)
    const [newRes, approvedRes, rejectedRes, suspendedRes, activeRes] = await Promise.all([
      supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'pending').neq('profiles.role', 'admin'),
      supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'approved').neq('profiles.role', 'admin'),
      supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'rejected').neq('profiles.role', 'admin'),
      supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'suspended').neq('profiles.role', 'admin'),
      supabase.from('resellers').select('id, profiles!inner(role)', { count: 'exact', head: true }).eq('status', 'approved').neq('profiles.role', 'admin'),
    ])

    const stats: ResellerStats = {
      new_registrations: newRes.count || 0,
      approved: approvedRes.count || 0,
      rejected: rejectedRes.count || 0,
      suspended: suspendedRes.count || 0,
      active: activeRes.count || 0,
    }

    return {
      resellers,
      total: count || 0,
      stats,
    }
  } catch (error) {
    console.error('Failed to fetch resellers:', error)
    return {
      resellers: [],
      total: 0,
      stats: { new_registrations: 0, approved: 0, rejected: 0, suspended: 0, active: 0 },
    }
  }
}

export default async function ResellersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters: ResellerFilters = {
    status: sp.status as any,
    search: sp.search as string,
    dateFrom: sp.dateFrom as string,
    dateTo: sp.dateTo as string,
    page: Number(sp.page) || 1,
  }

  const { resellers, total, stats } = await fetchResellersData(filters)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resellers</h1>
          <p className="text-sm text-slate-600">Reseller Management</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
            <FileDown className="h-4 w-4" />
            Export Statistics
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            View New Registrations
          </button>
        </div>
      </div>

      {/* Filters */}
      <ResellersFilters />

      {/* Stats */}
      <ResellersStats stats={stats} />

      {/* Table */}
      <ResellersTable resellers={resellers} total={total} currentPage={filters.page || 1} />
    </div>
  )
}
