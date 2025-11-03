import { getCatalog } from './actions'
import CatalogFilters from '@/components/reseller/CatalogFilters'
import CatalogGrid from '@/components/reseller/CatalogGrid'

export default async function ResellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)
  
  const { items, total, categories } = await getCatalog({
    q: params.q,
    category_id: params.category,
    page,
    perPage: 20,
  })

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Browse Catalog</h1>
      
      <CatalogFilters categories={categories} />
      
      <CatalogGrid items={items} total={total} currentPage={page} />
    </div>
  )
}
