import { supabaseServer } from '@/lib/supabase-server'
import ProductForm from '@/components/admin/products/ProductForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { ProductFormInput } from '@/lib/validations/product'

async function fetchProductData(productId: string) {
  const supabase = await supabaseServer()

  // Fetch product
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !product) return null

  // Fetch categories and subcategories
  const [categoriesRes, subCategoriesRes] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('subcategories').select('id, name, category_id').order('name'),
  ])

  // Transform product data to form format
  const formData: Partial<ProductFormInput> = {
    name: product.name,
    description: product.description || '',
    category_id: product.category_id,
    sub_category_id: product.subcategory_id || '',
    tunch_percentage: product.tunch_percentage,
    labor_per_kg: product.labor_per_kg,
    weight_ranges: product.weight_ranges || [],
    images: product.images || [],
    hsn_code: product.hsn_code || '',
    status: product.status,
    offer_enabled: product.offer_enabled,
    offer_type: product.offer_type || 'percentage',
    offer_value: product.offer_value || 0,
    offer_text: product.offer_text || '',
    offer_valid_from: product.offer_valid_from || '',
    offer_valid_till: product.offer_valid_till || '',
  }

  return {
    product: formData,
    productName: product.name,
    categories: categoriesRes.data || [],
    subCategories: subCategoriesRes.data || [],
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchProductData(id)

  if (!data) {
    notFound()
  }

  const { product, productName, categories, subCategories } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
          <p className="text-sm text-slate-600">{productName}</p>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        categories={categories}
        subCategories={subCategories}
        initialData={product}
        productId={id}
      />
    </div>
  )
}
