'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Subcategory = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CategoryWithSubcategories = Category & {
  subcategories: Subcategory[]
}

// Get all categories with their subcategories
export async function getAllCategories(): Promise<CategoryWithSubcategories[]> {
  const supabase = await supabaseAdmin()

  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories (*)
    `)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return categories.map(cat => ({
    ...cat,
    subcategories: (cat.subcategories as Subcategory[]).sort((a, b) => a.display_order - b.display_order)
  }))
}

// Create category
export async function createCategory(data: {
  name: string
  slug: string
  description?: string
  display_order?: number
  is_active?: boolean
}): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const supabase = await supabaseAdmin()

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        display_order: data.display_order ?? 0,
        is_active: data.is_active ?? true,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categories')
    return { success: true, id: category.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update category
export async function updateCategory(
  id: string,
  data: Partial<{
    name: string
    slug: string
    description: string | null
    display_order: number
    is_active: boolean
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseAdmin()

    const { error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete category
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseAdmin()

    // Check if category has products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (products && products.length > 0) {
      return { success: false, error: 'Cannot delete category with existing products' }
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Create subcategory
export async function createSubcategory(data: {
  category_id: string
  name: string
  slug: string
  description?: string
  display_order?: number
  is_active?: boolean
}): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const supabase = await supabaseAdmin()

    const { data: subcategory, error } = await supabase
      .from('subcategories')
      .insert({
        category_id: data.category_id,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        display_order: data.display_order ?? 0,
        is_active: data.is_active ?? true,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categories')
    return { success: true, id: subcategory.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update subcategory
export async function updateSubcategory(
  id: string,
  data: Partial<{
    name: string
    slug: string
    description: string | null
    display_order: number
    is_active: boolean
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseAdmin()

    const { error } = await supabase
      .from('subcategories')
      .update(data)
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete subcategory
export async function deleteSubcategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseAdmin()

    // Check if subcategory has products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('subcategory_id', id)
      .limit(1)

    if (products && products.length > 0) {
      return { success: false, error: 'Cannot delete subcategory with existing products' }
    }

    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get category stats
export async function getCategoryStats(categoryId: string): Promise<{
  totalProducts: number
  activeProducts: number
}> {
  const supabase = await supabaseAdmin()

  const { data: products } = await supabase
    .from('products')
    .select('status')
    .eq('category_id', categoryId)

  const totalProducts = products?.length ?? 0
  const activeProducts = products?.filter(p => p.status === 'active').length ?? 0

  return { totalProducts, activeProducts }
}
