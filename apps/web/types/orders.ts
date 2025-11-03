export interface Order {
  id: string
  order_code: string
  reseller_id: string
  status: OrderStatus
  total_price: number
  total_weight_kg: number
  shipping_address: string | null
  notes: string | null
  tracking_number: string | null
  logistics_provider: string | null
  created_at: string
  updated_at: string
}

export interface OrderWithReseller extends Order {
  reseller_name: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  hsn_code: string | null
  weight_kg: number
  quantity: number
  price: number
  tunch_percentage: number
  labor_per_kg: number
  offer_enabled: boolean
  offer_type: string | null
  offer_value: number | null
}

export interface OrderDetail extends Order {
  reseller_name: string
  items: OrderItem[]
  gst_rate: number
  silver_rate: number
}

export interface OrderStats {
  new_orders: number
  pending: number
  dispatched: number
  pipeline: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
}

export type OrderStatus = 
  | 'pending' 
  | 'accepted' 
  | 'in_making' 
  | 'dispatched' 
  | 'delivered' 
  | 'rejected' 
  | 'cancelled'

export interface OrderFilters {
  status?: OrderStatus
  dateFrom?: string
  dateTo?: string
  resellerId?: string
  search?: string
}

export interface PriceBreakdown {
  base: number
  deduction: number
  labor: number
  subtotalBeforeOffer: number
  offer: number
  subtotalAfterOffer: number
  gst: number
  lineTotal: number
}
