'use client'

import { ProductWithCategory } from '@/types/products'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Edit, Trash2, Copy } from 'lucide-react'
import OfferBadge from './OfferBadge'
import { toggleProductStatus, deleteProduct } from '@/app/(admin)/admin/products/actions'
import { toast } from 'sonner'
import Image from 'next/image'
import { toPublicUrl } from '@/lib/images'

interface ProductsTableProps {
  products: ProductWithCategory[]
  total: number
  currentPage: number
}

export default function ProductsTable({ products, total, currentPage }: ProductsTableProps) {
  const router = useRouter()
  const perPage = 20
  const totalPages = Math.ceil(total / perPage)

  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setToggleLoading(id)
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const result = await toggleProductStatus(id, newStatus)
    setToggleLoading(null)

    if (result.ok) {
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    const result = await deleteProduct(id)
    if (result.ok) {
      toast.success('Product deleted successfully')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`/admin/products?${params.toString()}`)
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-200 text-center">
        <p className="text-slate-600">No products found. Add a new product to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, total)} of {total}
        </div>
        <button className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200">
          Export Catalog
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium uppercase">Thumbnail</th>
              <th className="text-left py-3 px-4 text-xs font-medium uppercase">Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium uppercase">Category</th>
              <th className="text-center py-3 px-4 text-xs font-medium uppercase">Tunch (%)</th>
              <th className="text-right py-3 px-4 text-xs font-medium uppercase">Labor (₹/kg)</th>
              <th className="text-center py-3 px-4 text-xs font-medium uppercase">Offers</th>
              <th className="text-center py-3 px-4 text-xs font-medium uppercase">Status</th>
              <th className="text-center py-3 px-4 text-xs font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="h-12 w-12 rounded overflow-hidden bg-slate-100">
                    {product.images?.[0] ? (
                      <Image
                        src={toPublicUrl(product.images[0])}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Link href={`/admin/products/${product.id}/edit`} className="text-blue-600 hover:underline font-medium">
                    {product.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-slate-600 text-sm">{product.category_name}</td>
                <td className="py-3 px-4 text-center text-slate-900">{product.tunch_percentage.toFixed(1)}</td>
                <td className="py-3 px-4 text-right text-slate-900">₹{product.labor_per_kg.toLocaleString()}</td>
                <td className="py-3 px-4 text-center">
                  <OfferBadge
                    enabled={product.offer_enabled}
                    type={product.offer_type}
                    value={product.offer_value}
                    text={product.offer_text}
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleStatus(product.id, product.status)}
                    disabled={toggleLoading === product.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                      product.status === 'active' ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        product.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="p-1.5 hover:bg-slate-100 rounded"
                      title="View/Edit"
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="p-1.5 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-slate-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 hover:bg-slate-100 rounded"
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
