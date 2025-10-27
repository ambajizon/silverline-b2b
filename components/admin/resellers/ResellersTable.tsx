'use client'

import { ResellerWithProfile } from '@/types/resellers'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, CheckCircle, Ban, Trash2 } from 'lucide-react'
import { approveReseller, suspendReseller, deleteReseller } from '@/app/(admin)/admin/resellers/actions'
import { toast } from 'sonner'

interface ResellersTableProps {
  resellers: ResellerWithProfile[]
  total: number
  currentPage: number
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  suspended: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ResellersTable({ resellers, total, currentPage }: ResellersTableProps) {
  const router = useRouter()
  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Approve reseller "${name}"?`)) return

    setActionLoading(id)
    const result = await approveReseller(id)
    setActionLoading(null)

    if (result.ok) {
      toast.success('Reseller approved successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleSuspend = async (id: string, name: string) => {
    if (!confirm(`Suspend reseller "${name}"?`)) return

    setActionLoading(id)
    const result = await suspendReseller(id)
    setActionLoading(null)

    if (result.ok) {
      toast.success('Reseller suspended successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return

    setActionLoading(id)
    const result = await deleteReseller(id)
    setActionLoading(null)

    if (result.ok) {
      toast.success('Reseller deleted successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`/admin/resellers?${params.toString()}`)
  }

  if (resellers.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200 text-center">
        <p className="text-slate-600">No resellers found</p>
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
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">Registration Date</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Status</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Credit Limit</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Discount (%)</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Global Loop (%)</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resellers.map((reseller) => (
              <tr key={reseller.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <Link href={`/admin/resellers/${reseller.id}`} className="text-blue-600 hover:underline font-medium">
                    {reseller.shop_name}
                  </Link>
                  <p className="text-xs text-slate-500">{reseller.contact_name}</p>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">{reseller.email}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{reseller.phone}</td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {new Date(reseller.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[reseller.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {reseller.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-900">
                  {reseller.credit_limit ? `₹${reseller.credit_limit.toLocaleString()}` : '—'}
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-900">
                  {reseller.discount_percentage ?? '—'}
                </td>
                <td className="py-3 px-4 text-center text-sm text-slate-900">
                  {reseller.extra_charges_percentage ?? '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/admin/resellers/${reseller.id}`}
                      className="p-1.5 hover:bg-slate-100 rounded"
                      title="View"
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                    </Link>
                    {reseller.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(reseller.id, reseller.shop_name)}
                        disabled={actionLoading === reseller.id}
                        className="p-1.5 hover:bg-green-50 rounded"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </button>
                    )}
                    {reseller.status === 'approved' && (
                      <button
                        onClick={() => handleSuspend(reseller.id, reseller.shop_name)}
                        disabled={actionLoading === reseller.id}
                        className="p-1.5 hover:bg-orange-50 rounded"
                        title="Suspend"
                      >
                        <Ban className="h-4 w-4 text-orange-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(reseller.id, reseller.shop_name)}
                      disabled={actionLoading === reseller.id}
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
