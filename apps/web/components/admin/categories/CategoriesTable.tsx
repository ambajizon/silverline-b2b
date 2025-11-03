'use client'

import React, { useState } from 'react'
import { CategoryWithSubcategories } from '@/app/(admin)/admin/categories/actions'
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import CategoryModal from './CategoryModal'
import SubcategoryModal from './SubcategoryModal'
import { deleteCategory, deleteSubcategory } from '@/app/(admin)/admin/categories/actions'

interface CategoriesTableProps {
  categories: CategoryWithSubcategories[]
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<CategoryWithSubcategories | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategory?: any } | null>(null)

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all its subcategories.`)) {
      return
    }

    const result = await deleteCategory(id)
    if (result.success) {
      alert('Category deleted successfully')
      window.location.reload()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleDeleteSubcategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    const result = await deleteSubcategory(id)
    if (result.success) {
      alert('Subcategory deleted successfully')
      window.location.reload()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Subcategories
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id)
              return (
                <React.Fragment key={category.id}>
                  {/* Category Row */}
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="text-sm font-medium text-slate-900">{category.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{category.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{category.subcategories.length}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {category.display_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingSubcategory({ categoryId: category.id })}
                          className="text-green-600 hover:text-green-900"
                          title="Add Subcategory"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Subcategories Rows */}
                  {isExpanded && category.subcategories.map((subcategory) => (
                    <tr key={subcategory.id} className="bg-slate-50">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 pl-8">
                          <div className="text-sm text-slate-700">↳ {subcategory.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{subcategory.slug}</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-400">—</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subcategory.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subcategory.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                        {subcategory.display_order}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingSubcategory({ categoryId: category.id, subcategory })}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No categories found. Create your first category to get started.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
      {editingSubcategory && (
        <SubcategoryModal
          categoryId={editingSubcategory.categoryId}
          subcategory={editingSubcategory.subcategory}
          onClose={() => setEditingSubcategory(null)}
        />
      )}
    </>
  )
}
