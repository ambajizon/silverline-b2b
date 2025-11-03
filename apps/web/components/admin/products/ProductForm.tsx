'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productFormSchema, ProductFormInput } from '@/lib/validations/product'
import { Category, SubCategory } from '@/types/products'
import { useState, useEffect } from 'react'
import ImageUploader from './ImageUploader'
import WeightRangesEditor from './WeightRangesEditor'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/app/(admin)/admin/products/actions'
import { toast } from 'sonner'

interface ProductFormProps {
  categories: Category[]
  subCategories: SubCategory[]
  initialData?: Partial<ProductFormInput>
  productId?: string
}

export default function ProductForm({ categories, subCategories, initialData, productId }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category_id: initialData?.category_id || '',
      sub_category_id: initialData?.sub_category_id || '',
      tunch_percentage: initialData?.tunch_percentage || 92,
      labor_per_kg: initialData?.labor_per_kg || 5000,
      weight_ranges: initialData?.weight_ranges || [],
      images: initialData?.images || [],
      hsn_code: initialData?.hsn_code || '7113',
      status: initialData?.status || 'active',
      offer_enabled: initialData?.offer_enabled || false,
      offer_type: initialData?.offer_type || 'percentage',
      offer_value: initialData?.offer_value || 0,
      offer_text: initialData?.offer_text || '',
      offer_valid_from: initialData?.offer_valid_from || '',
      offer_valid_till: initialData?.offer_valid_till || '',
    },
  })

  const categoryId = watch('category_id')
  const images = watch('images')
  const weightRanges = watch('weight_ranges')
  const offerEnabled = watch('offer_enabled')

  // Filter subcategories by selected category
  const filteredSubCategories = categoryId
    ? subCategories.filter(sc => sc.category_id === categoryId)
    : []

  // Reset subcategory when category changes
  useEffect(() => {
    if (categoryId && initialData?.category_id !== categoryId) {
      setValue('sub_category_id', '')
    }
  }, [categoryId, setValue, initialData?.category_id])

  const onSubmit = async (data: ProductFormInput) => {
    setLoading(true)

    try {
      const result = productId
        ? await updateProduct(productId, data)
        : await createProduct(data)

      if (result.ok) {
        toast.success(productId ? 'Product updated successfully' : 'Product created successfully')
        router.push('/admin/products')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const onError = () => {
    toast.error('Please fix all validation errors before saving')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g., Classic Silver Ring"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Detailed description of the product..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category_id')}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory (Optional)</label>
              <select
                {...register('sub_category_id')}
                disabled={!categoryId}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Category First</option>
                {filteredSubCategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">HSN Code</label>
            <input
              {...register('hsn_code')}
              placeholder="e.g., 7113"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tunch (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              {...register('tunch_percentage', { valueAsNumber: true })}
              placeholder="e.g., 92.5"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.tunch_percentage && <p className="text-red-500 text-sm mt-1">{errors.tunch_percentage.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Labor (₹/kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              {...register('labor_per_kg', { valueAsNumber: true })}
              placeholder="e.g., 5000"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.labor_per_kg 
                  ? 'border-red-500 focus:ring-red-600' 
                  : 'border-slate-300 focus:ring-blue-600'
              }`}
            />
            {errors.labor_per_kg && <p className="text-red-500 text-sm mt-1">{errors.labor_per_kg.message}</p>}
          </div>
        </div>
      </div>

      {/* Weight Ranges */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Weight Ranges (Display Only)</h2>
        <WeightRangesEditor
          ranges={weightRanges}
          onChange={(ranges) => setValue('weight_ranges', ranges)}
        />
      </div>

      {/* Product Images */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Images</h2>
        <ImageUploader
          images={images}
          onChange={(imgs) => setValue('images', imgs)}
        />
      </div>

      {/* Offers */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Offers</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('offer_enabled')}
              className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
            />
            <span className="text-sm font-medium text-slate-700">Enable Offer</span>
          </label>
        </div>

        {offerEnabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Offer Type</label>
                <select
                  {...register('offer_type')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Offer Value</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('offer_value', { valueAsNumber: true })}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.offer_value && <p className="text-red-500 text-sm mt-1">{errors.offer_value.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Offer Text</label>
              <input
                {...register('offer_text')}
                placeholder="e.g., 10% OFF"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valid From (Optional)</label>
                <input
                  type="datetime-local"
                  {...register('offer_valid_from')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valid Till (Optional)</label>
                <input
                  type="datetime-local"
                  {...register('offer_valid_till')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Status</h2>
        <select
          {...register('status')}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-md hover:bg-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
