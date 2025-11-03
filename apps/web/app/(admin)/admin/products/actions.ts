'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/roles'
import { productFormSchema } from '@/lib/validations/product'
import { ProductFormInput } from '@/lib/validations/product'
import type {
  Category,
  SubCategory,
  Product,
  ProductWithCategory,
  ProductFilters,
  ProductStats,
} from '@/types/products'

type ActionResult<T = any> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function verifyAdmin() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, supabase }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  
  if (!isAdmin(profile?.role)) return { authorized: false, supabase }
  return { authorized: true, supabase }
}

export async function createProduct(input: ProductFormInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Validate input
    const validated = productFormSchema.parse(input)

    // Prepare data
    const productData: any = {
      name: validated.name,
      description: validated.description || null,
      category_id: validated.category_id,
      subcategory_id: validated.sub_category_id || null,
      tunch_percentage: validated.tunch_percentage,
      labor_per_kg: validated.labor_per_kg,
      weight_ranges: validated.weight_ranges,
      images: validated.images,
      hsn_code: validated.hsn_code || null,
      status: validated.status,
      offer_enabled: validated.offer_enabled,
      offer_type: validated.offer_enabled ? validated.offer_type : null,
      offer_value: validated.offer_enabled ? validated.offer_value : null,
      offer_text: validated.offer_enabled ? validated.offer_text : null,
      offer_valid_from: validated.offer_enabled ? validated.offer_valid_from : null,
      offer_valid_till: validated.offer_enabled ? validated.offer_valid_till : null,
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/admin/products')
    revalidatePath('/reseller/products')
    return { ok: true, data: { id: data.id } }
  } catch (error: any) {
    console.error('Create product error:', error)
    return { ok: false, error: error.message || 'Failed to create product' }
  }
}

export async function updateProduct(id: string, input: ProductFormInput): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Validate input
    const validated = productFormSchema.parse(input)

    // Prepare data
    const productData: any = {
      name: validated.name,
      description: validated.description || null,
      category_id: validated.category_id,
      subcategory_id: validated.sub_category_id || null,
      tunch_percentage: validated.tunch_percentage,
      labor_per_kg: validated.labor_per_kg,
      weight_ranges: validated.weight_ranges,
      images: validated.images,
      hsn_code: validated.hsn_code || null,
      status: validated.status,
      offer_enabled: validated.offer_enabled,
      offer_type: validated.offer_enabled ? validated.offer_type : null,
      offer_value: validated.offer_enabled ? validated.offer_value : null,
      offer_text: validated.offer_enabled ? validated.offer_text : null,
      offer_valid_from: validated.offer_enabled ? validated.offer_valid_from : null,
      offer_valid_till: validated.offer_enabled ? validated.offer_valid_till : null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}/edit`)
    revalidatePath('/reseller/products')
    return { ok: true }
  } catch (error: any) {
    console.error('Update product error:', error)
    return { ok: false, error: error.message || 'Failed to update product' }
  }
}

export async function toggleProductStatus(id: string, toStatus: 'active' | 'inactive'): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('products')
      .update({ status: toStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/products')
    revalidatePath('/reseller/products')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to toggle status' }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Fetch images to remove from storage
    const { data: prod } = await supabase
      .from('products')
      .select('images')
      .eq('id', id)
      .maybeSingle()

    // Delete product row
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Best-effort delete images from storage
    try {
      const images: string[] = Array.isArray(prod?.images) ? prod!.images : []
      if (images.length) {
        const paths = images
          .map(u => extractStoragePath(u))
          .filter(Boolean) as string[]
        if (paths.length) {
          await supabase.storage.from('product-images').remove(paths)
        }
      }
    } catch (e) {
      // ignore storage cleanup errors
    }

    revalidatePath('/admin/products')
    revalidatePath('/reseller/products')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to delete product' }
  }
}

// ===== Categories =====

export async function getCategories(): Promise<ActionResult<Category[]>> {
  try {
    const supabase = await supabaseServer()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, created_at')
      .order('name')
    if (error) throw error
    return { ok: true, data: (data ?? []) as Category[] }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch categories' }
  }
}

export async function createCategory(name: string, description?: string): Promise<ActionResult<Category>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, description: description || null })
      .select('id, name, description, created_at')
      .single()
    if (error) throw error

    revalidatePath('/admin/products')
    return { ok: true, data: data as Category }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to create category' }
  }
}

export async function updateCategory(id: string, name: string, description?: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('categories')
      .update({ name, description: description || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    revalidatePath('/admin/products')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to update category' }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    // Prevent delete if category has products
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
    if ((count ?? 0) > 0) {
      return { ok: false, error: 'Cannot delete category with products' }
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw error

    revalidatePath('/admin/products')
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to delete category' }
  }
}

// ===== Sub-Categories =====

export async function getSubCategories(categoryId: string): Promise<ActionResult<SubCategory[]>> {
  try {
    const supabase = await supabaseServer()
    const { data, error } = await supabase
      .from('subcategories')
      .select('id, category_id, name, description, created_at')
      .eq('category_id', categoryId)
      .order('name')
    if (error) throw error
    return { ok: true, data: (data ?? []) as SubCategory[] }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch sub-categories' }
  }
}

export async function createSubCategory(categoryId: string, name: string, description?: string): Promise<ActionResult<SubCategory>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('subcategories')
      .insert({ category_id: categoryId, name, description: description || null })
      .select('id, category_id, name, description, created_at')
      .single()
    if (error) throw error

    revalidatePath('/admin/products')
    return { ok: true, data: data as SubCategory }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to create sub-category' }
  }
}

// ===== Products (queries) =====

export async function getProducts(filters: ProductFilters): Promise<ActionResult<{ products: ProductWithCategory[]; total: number }>> {
  try {
    const supabase = await supabaseServer()

    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name),
        subcategories(name)
      `, { count: 'exact' })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.category_id) query = query.eq('category_id', filters.category_id)
    if (filters.sub_category_id) query = query.eq('subcategory_id', filters.sub_category_id)
    if (filters.search) query = query.ilike('name', `%${filters.search}%`)

    const { data: productsData, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const products: ProductWithCategory[] = (productsData || []).map((p: any) => ({
      ...p,
      category_name: p.categories?.name || '—',
      sub_category_name: p.subcategories?.name || '—',
    }))

    return { ok: true, data: { products, total: count || 0 } }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch products' }
  }
}

export async function getProductById(id: string): Promise<ActionResult<Product>> {
  try {
    const supabase = await supabaseServer()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return { ok: true, data: data as Product }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch product' }
  }
}

export async function updateProductStatus(id: string, status: 'active' | 'inactive'): Promise<ActionResult> {
  return toggleProductStatus(id, status)
}

export async function getProductStats(): Promise<ActionResult<ProductStats>> {
  try {
    const supabase = await supabaseServer()
    const [activeRes, offersRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('offer_enabled', true),
    ])
    const stats: ProductStats = {
      active: activeRes.count || 0,
      with_offers: offersRes.count || 0,
      low_stock: 0,
    }
    return { ok: true, data: stats }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to fetch product stats' }
  }
}

// ===== Images (optional helpers) =====

function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath) return null
  // Already a bare path
  if (!urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://')) {
    // Could be absolute like /storage/v1/object/public/product-images/xyz.jpg or a bare path
    const marker = '/storage/v1/object/public/product-images/'
    const idx = urlOrPath.indexOf(marker)
    if (idx >= 0) return urlOrPath.slice(idx + marker.length)
    return urlOrPath.replace(/^\/+/, '')
  }
  // Absolute public URL
  const marker = '/storage/v1/object/public/product-images/'
  const idx = urlOrPath.indexOf(marker)
  if (idx >= 0) return urlOrPath.slice(idx + marker.length)
  return null
}

export async function uploadProductImage(productId: string, file: File): Promise<ActionResult<string>> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
    const path = `${productId}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(path, file)
    if (upErr) throw upErr

    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return { ok: true, data: data.publicUrl }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to upload image' }
  }
}

export async function deleteProductImage(pathOrUrl: string): Promise<ActionResult> {
  try {
    const { authorized, supabase } = await verifyAdmin()
    if (!authorized) return { ok: false, error: 'Unauthorized' }

    const path = extractStoragePath(pathOrUrl)
    if (!path) return { ok: false, error: 'Invalid image path' }

    const { error } = await supabase.storage.from('product-images').remove([path])
    if (error) throw error
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Failed to delete image' }
  }
}
