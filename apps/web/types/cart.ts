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
  productId: string
  product_name: string
  name: string
  product_image: string | null
  image: string | null
  weight_kg: number
  weightKg: number
  weight_ranges?: WeightRangeInput[] | null
  segments?: Array<{ range: { min: number; max: number }; weight_kg: number }> | null
  price_snapshot: any
  price: number
  total: number
  preTaxTotal: number
  silverRate: number
  deductionPct: number
  laborPerKg: number
  offerDiscount?: number
  hsnCode?: string
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

