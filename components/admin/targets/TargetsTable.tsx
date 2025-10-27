'use client'

import { TargetWithProgress } from '@/types/targets'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Edit, Pause, Play, Trash2 } from 'lucide-react'
import { pauseTarget, resumeTarget, deleteTarget } from '@/app/(admin)/admin/targets/actions'
import { toast } from 'sonner'

interface TargetsTableProps {
  targets: TargetWithProgress[]
  total: number
  currentPage: number
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-red-100 text-red-700',
  suspended: 'bg-orange-100 text-orange-700',
}

const typeLabels: Record<string, string> = {
  purchase_value: 'Purchase Value',
  weight: 'Weight',
  order_count: 'Order Count',
  category_specific: 'Category Specific',
  revenue: 'Revenue',
}

export default function TargetsTable({ targets, total, currentPage }: TargetsTableProps) {
  const router = useRouter()
  const perPage = 20
  const totalPages = Math.ceil(total / perPage)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDeadlineBadge = (deadline: string) => {
    const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntil < 0) return <span className="text-xs text-red-600 font-medium">Expired</span>
    if (daysUntil <= 7) return <span className="text-xs text-orange-600 font-medium">{daysUntil}d left</span>
    return <span className="text-xs text-slate-600">{new Date(deadline).toLocaleDateString('en-IN')}</span>
  }

  const handlePause = async (id: string, name: string) => {
    if (!confirm(`Pause target "${name}"?`)) return

    setActionLoading(id)
    const result = await pauseTarget(id)
    setActionLoading(null)

    if (result.ok) {
      toast.success('Target paused')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleResume = async (id: string, name: string) => {
    if (!confirm(`Resume target "${name}"?`)) return

    setActionLoading(id)
    const result = await resumeTarget(id)
    setActionLoading(null)

    if (result.ok) {
      toast.success('Target resumed')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete target "${name}"? This action cannot be undone.`)) return

    setActionLoading(id)
    const result = await deleteTarget(id)
    setActionLoading(null)

    if (result.ok) {
      toast.success('Target deleted')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`/admin/targets?${params.toString()}`)
  }

  if (targets.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200 text-center">
        <p className="text-slate-600">No targets found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, total)} of {total}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Reseller Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Target Name</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Type</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Goal</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Deadline</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Progress</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Qualification</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Reward</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Status</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targets.map((target) => (
              <tr key={target.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-sm font-medium text-slate-900">
                  {target.reseller_name || 'Open to all'}
                </td>
                <td className="py-3 px-4">
                  <Link href={`/admin/targets/${target.id}`} className="text-sm text-blue-600 hover:underline font-medium">
                    {target.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-600">
                  {typeLabels[target.type] || target.type}
                </td>
                <td className="py-3 px-4 text-center text-sm font-medium text-slate-900">
                  {target.type === 'purchase_value' || target.type === 'revenue'
                    ? formatCurrency(target.goal)
                    : target.goal.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  {getDeadlineBadge(target.deadline)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full transition-all"
                        style={{ width: `${Math.min(100, target.progress_percentage)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600">{Math.round(target.progress_percentage)}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      target.is_qualified
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {target.is_qualified ? 'Qualified' : 'Not Qualified'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-900">
                  {target.reward_value
                    ? target.reward_type === 'cashback'
                      ? formatCurrency(target.reward_value)
                      : `${target.reward_value}%`
                    : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[target.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {target.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      href={`/admin/targets/${target.id}`}
                      className="p-1.5 hover:bg-slate-100 rounded"
                      title="View"
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                    </Link>
                    <Link
                      href={`/admin/targets/${target.id}`}
                      className="p-1.5 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Link>
                    {target.status === 'active' || target.status === 'in_progress' ? (
                      <button
                        onClick={() => handlePause(target.id, target.name)}
                        disabled={actionLoading === target.id}
                        className="p-1.5 hover:bg-orange-50 rounded"
                        title="Pause"
                      >
                        <Pause className="h-4 w-4 text-orange-600" />
                      </button>
                    ) : target.status === 'suspended' ? (
                      <button
                        onClick={() => handleResume(target.id, target.name)}
                        disabled={actionLoading === target.id}
                        className="p-1.5 hover:bg-green-50 rounded"
                        title="Resume"
                      >
                        <Play className="h-4 w-4 text-green-600" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleDelete(target.id, target.name)}
                      disabled={actionLoading === target.id}
                      className="p-1.5 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
