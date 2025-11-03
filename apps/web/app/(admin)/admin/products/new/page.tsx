import { supabaseServer } from '@/lib/supabase-server'
import ProductForm from '@/components/admin/products/ProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function fetchFormData() {
  const supabase = await supabaseServer()

  const [categoriesRes, subCategoriesRes] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('subcategories').select('id, name, category_id').order('name'),
  ])

  return {
    categories: categoriesRes.data || [],
    subCategories: subCategoriesRes.data || [],
  }
}

export default async function NewProductPage() {
  const { categories, subCategories } = await fetchFormData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
          <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
            ← Back to Products
          </Link>
        </div>
      </div>

      {/* Form */}
      <ProductForm categories={categories} subCategories={subCategories} />
    </div>
  )
}
