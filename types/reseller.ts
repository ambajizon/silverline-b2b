export type LiveRate = {
  rate_per_gram: number
  updated_at: string
  change_24h_pct: number | null
}

export type RatePoint = { ts: string; rate: number }

export type TargetSummary = {
  id: string
  name: string
  goal_value: number
  reward: string | null
  progress_pct: number
  days_left: number
}

export type OrderRow = {
  id: string
  order_code: string
  created_at: string
  total_amount: number
  status: 'pending' | 'accepted' | 'in_making' | 'dispatched' | 'delivered' | 'rejected' | 'cancelled'
}

export type ResellerProfile = {
  id: string
  first_name?: string | null
  human_code?: string | null
  shop_name?: string | null
  logo_url?: string | null
}

// Products
export type Category = {
  id: string
  name: string
}

export type SubCategory = {
  id: string
  name: string
  category_id: string
}

export type WeightRange = {
  min: number
  max: number
  unit: string
}

export type WeightSegment = {
  range: { min: number; max: number }
  weight_kg: number
}

export type ProductListItem = {
  id: string
  name: string
  category_name: string | null
  image: string | null
  status: string
}

export type Product = {
  id: string
  name: string
  description: string | null
  category_id: string | null
  sub_category_id: string | null
  category_name: string | null
  sub_category_name: string | null
  tunch_percentage: number
  labor_per_kg: number
  weight_ranges: WeightRange[]
  images: string[]
  hsn_code: string | null
  status: string
  offer_enabled: boolean
  offer_type: string | null
  offer_value: number | null
  offer_text: string | null
}

export type PriceBreakdown = {
  weight_kg: number
  silver_rate: number
  base_price: number
  deduction_pct: number
  deduction_amount: number
  labor_charges: number
  subtotal: number
  // Reseller-specific discount and global loop
  reseller_discount_pct?: number
  reseller_discount_amount?: number
  global_loop_pct?: number
  global_loop_amount?: number
  offer_discount: number
  taxable_amount: number
  gst_rate: number
  gst_amount: number
  total_price: number
  // GST Breakdown for Indian compliance
  is_gst_enabled?: boolean
  is_same_state?: boolean
  cgst_rate?: number
  sgst_rate?: number
  igst_rate?: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  company_state_code?: string | null
  reseller_state_code?: string | null
}

export type CartItem = {
  productId: string
  name: string
  image: string | null
  weightKg: number       // total weight for this product (kg)
  price: number          // DEPRECATED: use total instead
  total: number          // total price for this product
  tunch: number
  labor: number
  offer: number
  segments?: WeightSegment[]
}

export type Cart = {
  items: CartItem[]
  totalQty: number
  totalAmount: number
}

export type OrderStatus = 'pending' | 'accepted' | 'in_making' | 'dispatched' | 'delivered' | 'rejected' | 'cancelled'

export type OrderListItem = {
  id: string
  order_number: string
  created_at: string
  status: OrderStatus
  total_amount: number
  total_weight: number
  item_count: number
}

export type OrderDetail = {
  id: string
  order_number: string
  created_at: string
  status: OrderStatus
  total_amount: number
  total_weight: number
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_pincode: string
  shipping_phone: string
  tracking_number: string | null
  delivery_partner: string | null
  notes: string | null
  items: OrderItemDetail[]
}

export type OrderItemDetail = {
  id: string
  product_id: string
  product_name: string
  product_image: string | null
  weight_kg: number
  quantity: number
  unit_price: number
  line_total: number
  tunch_percentage: number
  labor_per_kg: number
}

export type InvoiceData = {
  order: OrderDetail
  reseller: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
    email: string
  }
  company: {
    name: string
    address: string
    gstin: string
    phone: string
    email: string
  }
  breakdown: {
    subtotal: number
    gst_rate: number
    gst_amount: number
    total: number
  }
}
