'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductListItem } from '@/types/reseller'
import { toPublicUrl } from '@/lib/images'

interface CatalogGridProps {
  items: ProductListItem[]
  total: number
  currentPage: number
}

export default function CatalogGrid({ items, total, currentPage }: CatalogGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const perPage = 20
  const hasMore = currentPage * perPage < total

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(currentPage + 1))
    router.push(`/reseller/products?${params.toString()}`)
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 text-center">
        <p className="text-sm text-slate-500 mb-2">No products found</p>
        <p className="text-xs text-slate-400">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden"
          >
            {/* Product Image */}
            <div className="aspect-square bg-slate-100 relative">
              {product.image ? (
                <Image
                  src={toPublicUrl(product.image)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 420px) 50vw, 200px"
                  unoptimized
                  onError={(e) => {
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3">
              <h3 className="text-sm font-medium text-slate-900 mb-1 line-clamp-2">
                {product.name}
              </h3>
              {product.category_name && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 mb-2">
                  {product.category_name}
                </span>
              )}
              <Link
                href={`/reseller/products/${product.id}`}
                className="block w-full py-1.5 text-center text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                View Product
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          className="w-full py-2.5 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Load More ({total - currentPage * perPage} remaining)
        </button>
      )}

      {/* Results Count */}
      <p className="text-xs text-center text-slate-500">
        Showing {Math.min(items.length, total)} of {total} products
      </p>
    </div>
  )
}
