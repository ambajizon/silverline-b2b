import { getResellerTargets } from './actions'
import ResellerTargets from '@/components/admin/resellers/ResellerTargets'

export default async function ResellerTargetsPage() {
  const result = await getResellerTargets()

  if (!result.ok) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {result.error}
        </div>
      </div>
    )
  }

  const { targets = [], resellerId = '' } = result.data || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Targets</h1>
        <p className="text-sm text-slate-600 mt-1">
          Track your progress towards achieving targets and earning rewards
        </p>
      </div>

      <ResellerTargets targets={targets} resellerId={resellerId} />
    </div>
  )
}
