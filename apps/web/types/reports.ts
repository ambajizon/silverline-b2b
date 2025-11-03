export type ReportType = 'all' | 'sales' | 'product_performance' | 'reseller_activity' | 'payments' | 'targets'
export type DateRange = '7d' | '30d' | '90d' | 'custom'

export interface ReportFilters {
  date_range: DateRange
  date_from?: string
  date_to?: string
  report_type: ReportType
  reseller_id?: string
  search?: string
}

export interface SalesKPIs {
  total_revenue: number
  total_orders: number
  average_order_value: number
  total_quantity_kg: number
}

export interface SalesTrendPoint {
  date: string
  revenue: number
  orders: number
}

export interface CategorySales {
  category_name: string
  revenue: number
  units: number
  orders: number
}

export interface SalesTransaction {
  order_id: string
  order_number: string
  date: string
  reseller_name: string
  total_amount: number
  product_count: number
  payment_status: 'paid' | 'pending' | 'overdue' | 'partial'
}

export interface TopProduct {
  product_id: string
  product_name: string
  category_name: string
  units_sold: number
  revenue: number
}

export interface OverduePayment {
  count: number
  total_amount: number
}

export interface MonthlySummary {
  total_revenue: number
  total_orders: number
  growth_percent: number
}

export interface ReportPreview {
  monthly_summary: MonthlySummary
  top_products: TopProduct[]
  overdue_payments: OverduePayment
}

export interface SalesReportData {
  kpis: SalesKPIs
  trend: SalesTrendPoint[]
  by_category: CategorySales[]
  transactions: {
    data: SalesTransaction[]
    total: number
  }
}
