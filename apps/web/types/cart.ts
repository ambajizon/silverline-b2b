export type WeightRangeInput = {
  range: { min: number; max: number }
  weight_kg: number
}

export type AddToCartInput = {
  productId: string
  weightKg?: number
  ranges?: WeightRangeInput[]
}

export interface CartItem {
  id: string
  product_id: string
  product_name: string
  product_image: string | null
  weight_kg: number
  weight_ranges?: WeightRangeInput[] | null
  price_snapshot: any
  created_at: string
  updated_at: string
}

export interface CartSummary {
  itemCount: number
  totalWeightKg: number
  subtotal: number
  discount: number
  globalLoop: number
  taxable: number
  gst: number
  total: number
}

