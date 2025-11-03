import { supabaseServer } from '@/lib/supabase-server'
import { ProductFilters, ProductStats, ProductWithCategory } from '@/types/products'
import ProductsFilters from '@/components/admin/products/ProductsFilters'
import ProductsStats from '@/components/admin/products/ProductsStats'
import ProductsTable from '@/components/admin/products/ProductsTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function fetchProductsData(filters: ProductFilters) {
  const supabase = await supabaseServer()
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  try {
    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name),
        subcategories(name)
      `, { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters.sub_category_id) {
      query = query.eq('subcategory_id', filters.sub_category_id)
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    // Execute with pagination
    const { data: productsData, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Transform data
    const products: ProductWithCategory[] = (productsData || []).map((p: any) => ({
      ...p,
      category_name: p.categories?.name || '—',
      sub_category_name: p.subcategories?.name || '—',
    }))

    // Fetch stats
    const [activeRes, offersRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('offer_enabled', true),
    ])

    const stats: ProductStats = {
      active: activeRes.count || 0,
      with_offers: offersRes.count || 0,
      low_stock: 0, // Stub
    }

    // Fetch categories and subcategories for filters
    const [categoriesRes, subCategoriesRes] = await Promise.all([
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('subcategories').select('id, name, category_id').order('name'),
    ])

    return {
      products,
      total: count || 0,
      stats,
      categories: categoriesRes.data || [],
      subCategories: subCategoriesRes.data || [],
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return {
      products: [],
      total: 0,
      stats: { active: 0, with_offers: 0, low_stock: 0 },
      categories: [],
      subCategories: [],
    }
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  
  const filters: ProductFilters = {
    status: sp.status as any,
    category_id: sp.category_id as string,
    sub_category_id: sp.sub_category_id as string,
    search: sp.search as string,
    page: Number(sp.page) || 1,
  }

  const { products, total, stats, categories, subCategories } = await fetchProductsData(filters)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Product Management</h1>
            <p className="text-slate-300 text-sm mt-1">{total.toLocaleString()} Products</p>
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-4">
          <ProductsFilters categories={categories} subCategories={subCategories} />
        </div>
      </div>

      {/* Stats */}
      <ProductsStats stats={stats} />

      {/* Table */}
      <ProductsTable products={products} total={total} currentPage={filters.page || 1} />
    </div>
  )
}
