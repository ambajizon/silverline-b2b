export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial'
export type PaymentMode = 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'card'

export interface Payment {
  id: string
  order_id: string
  reseller_id: string
  amount: number
  payment_mode: PaymentMode
  reference: string | null
  note: string | null
  status: PaymentStatus
  payment_date: string
  created_at: string
}

export interface PaymentWithDetails extends Payment {
  reseller_name: string
  order_number: string
  invoice_date: string
  amount_due: number
  aging_days: number
}

export interface PaymentStats {
  total_outstanding: number
  paid_this_month: number
  overdue: number
  aging_90_plus: number
  payment_breakdown: {
    paid: number
    unpaid_overdue: number
    partial: number
  }
}

export interface PaymentFilters {
  status?: PaymentStatus
  date_from?: string
  date_to?: string
  reseller_id?: string
  aging_bucket?: 'all' | '<=30' | '31-60' | '61-90' | '>90'
  search?: string
  page?: number
}

export interface RecordPaymentInput {
  reseller_id: string
  amount: number
  payment_method?: string
  transaction_id?: string
  note?: string
}
