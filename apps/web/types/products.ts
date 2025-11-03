export interface Category {
  id: string
  name: string
  description?: string
  created_at?: string
}

export interface SubCategory {
  id: string
  category_id: string
  name: string
  description?: string
  created_at?: string
}

export interface WeightRange {
  min: number
  max: number
}

export type ProductStatus = 'active' | 'inactive'
export type OfferType = 'percentage' | 'fixed'

export interface Product {
  id: string
  name: string
  description: string | null
  category_id: string
  sub_category_id: string | null
  tunch_percentage: number
  labor_per_kg: number
  weight_ranges: WeightRange[]
  images: string[]
  hsn_code: string | null
  status: ProductStatus
  offer_enabled: boolean
  offer_type: OfferType | null
  offer_value: number | null
  offer_text: string | null
  offer_valid_from: string | null
  offer_valid_till: string | null
  created_at: string
  updated_at: string
}

export interface ProductWithCategory extends Product {
  category_name?: string
  sub_category_name?: string
}

export interface ProductFilters {
  status?: ProductStatus
  category_id?: string
  sub_category_id?: string
  search?: string
  page?: number
  limit?: number
}

export interface ProductStats {
  active: number
  with_offers: number
  low_stock: number
}

export interface ProductFormData {
  name: string
  description: string
  category_id: string
  sub_category_id: string
  tunch_percentage: number
  labor_per_kg: number
  weight_ranges: WeightRange[]
  images: string[]
  hsn_code: string
  status: ProductStatus
  offer_enabled: boolean
  offer_type?: OfferType
  offer_value?: number
  offer_text?: string
  offer_valid_from?: string
  offer_valid_till?: string
}
