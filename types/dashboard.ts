export interface DashboardMetrics {
  totalOrders: number
  totalRevenue: number
  activeResellers: number
  productsInStock: number
}

export interface SilverRate {
  rate: number
  createdAt?: string
}

export interface SilverRateTrend {
  day: string
  rate: number
}

export interface OrderPipelineStatus {
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
}

export interface TopReseller {
  id: string
  shop_name: string
  orders_count: number
  revenue: number
}

export interface TopProduct {
  id: string
  name: string
  lines_count: number
  units: number
}

export interface PaymentsSummary {
  received: number
  pending: number
  overdue: number
}

export interface RewardItem {
  reseller_id: string
  amount: number
  status: string
  created_at: string
}
