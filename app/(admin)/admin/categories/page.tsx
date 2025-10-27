import { getAllCategories } from './actions'
import CategoriesTable from '@/components/admin/categories/CategoriesTable'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-600 mt-1">Manage product categories and subcategories</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-slate-600">Total Categories</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{categories.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-slate-600">Active Categories</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {categories.filter(c => c.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-slate-600">Total Subcategories</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {categories.reduce((sum, c) => sum + c.subcategories.length, 0)}
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow">
        <CategoriesTable categories={categories} />
      </div>
    </div>
  )
}
