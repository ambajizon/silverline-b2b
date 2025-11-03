'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { Category, SubCategory } from '@/types/products'

interface ProductsFiltersProps {
  categories: Category[]
  subCategories: SubCategory[]
}

export default function ProductsFilters({ categories, subCategories }: ProductsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '')
  const [subCategoryId, setSubCategoryId] = useState(searchParams.get('sub_category_id') || '')

  // Filter subcategories by selected category
  const filteredSubCategories = categoryId
    ? subCategories.filter(sc => sc.category_id === categoryId)
    : subCategories

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (categoryId) params.set('category_id', categoryId)
    if (subCategoryId) params.set('sub_category_id', subCategoryId)
    params.set('page', '1')
    
    router.push(`/admin/products?${params.toString()}`)
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setCategoryId('')
    setSubCategoryId('')
    router.push('/admin/products')
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Status */}
      <div className="w-40">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full h-10 px-3 rounded-md bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Category */}
      <div className="w-48">
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setSubCategoryId('') // Reset subcategory when category changes
          }}
          className="w-full h-10 px-3 rounded-md bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      <div className="w-48">
        <select
          value={subCategoryId}
          onChange={(e) => setSubCategoryId(e.target.value)}
          disabled={!categoryId}
          className="w-full h-10 px-3 rounded-md bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">All Subcategories</option>
          {filteredSubCategories.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-full h-10 pl-10 pr-3 rounded-md bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetFilters}
        className="h-10 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-medium transition-colors flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>
    </div>
  )
}
