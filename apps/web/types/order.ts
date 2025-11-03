export type OrderStatus = 'pending' | 'accepted' | 'in_making' | 'dispatched' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string | null
  weight_kg: number
  weight_ranges?: any
  silver_rate: number
  base_price: number
  deduction_amount: number
  labor_charges: number
  discount_amount: number
  global_loop_amount: number
  gst_rate: number
  gst_amount: number
  item_total: number
}

export interface Order {
  id: string
  order_code: string
  reseller_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_weight_kg: number
  subtotal: number
  discount_amount: number
  global_loop_amount: number
  taxable_amount: number
  gst_amount: number
  total_price: number
  created_at: string
  updated_at: string
}

export interface CreateOrderInput {
  notes?: string
}

