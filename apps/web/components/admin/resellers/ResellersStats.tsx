import { ResellerStats } from '@/types/resellers'

interface ResellersStatsProps {
  stats: ResellerStats
}

export default function ResellersStats({ stats }: ResellersStatsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="px-6 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs text-yellow-700 mb-1">New Registrations (Pending)</span>
          <span className="text-3xl font-bold text-yellow-900">{stats.new_registrations}</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs text-green-700 mb-1">Approved</span>
          <span className="text-3xl font-bold text-green-900">{stats.approved}</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs text-red-700 mb-1">Rejected</span>
          <span className="text-3xl font-bold text-red-900">{stats.rejected}</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs text-orange-700 mb-1">Suspended</span>
          <span className="text-3xl font-bold text-orange-900">{stats.suspended}</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs text-blue-700 mb-1">Active</span>
          <span className="text-3xl font-bold text-blue-900">{stats.active}</span>
        </div>
      </div>
    </div>
  )
}
