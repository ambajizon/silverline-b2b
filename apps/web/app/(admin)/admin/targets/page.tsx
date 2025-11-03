import { Plus } from 'lucide-react'
import { TargetFilters } from '@/types/targets'
import { getTargetsAdmin } from './actions'
import TargetsKPICards from '@/components/admin/targets/TargetsKPICards'
import TargetsFilters from '@/components/admin/targets/TargetsFilters'
import TargetsTable from '@/components/admin/targets/TargetsTable'
import CreateTargetButton from '@/components/admin/targets/CreateTargetButton'

export default async function TargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const filters: TargetFilters = {
    status: sp.status as any,
    type: sp.type as any,
    reseller_id: sp.reseller_id as string,
    qualification: sp.qualification as any,
    date_from: sp.date_from as string,
    date_to: sp.date_to as string,
    search: sp.search as string,
    page: Number(sp.page) || 1,
  }

  const result = await getTargetsAdmin(filters)
  
  if (!result.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading targets: {result.error}
        </div>
      </div>
    )
  }

  const { targets = [], total = 0, kpis } = result.data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Targets</h1>
          <p className="text-sm text-slate-600">Target Management ({total})</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50">
            Export Targets
          </button>
          <CreateTargetButton />
        </div>
      </div>

      {/* Filters */}
      <TargetsFilters />

      {/* KPI Cards */}
      {kpis && <TargetsKPICards kpis={kpis} />}

      {/* Table */}
      <TargetsTable targets={targets} total={total} currentPage={filters.page || 1} />
    </div>
  )
}
