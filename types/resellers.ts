export type ResellerStatus = 'pending' | 'approved' | 'suspended' | 'rejected'

export interface Reseller {
  id: string
  user_id: string
  shop_name: string
  status: ResellerStatus
  contact_name: string
  phone: string
  address: string
  logo_url: string | null
  brand_color_primary: string | null
  brand_color_secondary: string | null
  created_at: string
  updated_at: string
}

export interface ResellerWithProfile extends Reseller {
  email?: string
  credit_limit?: number
  discount_percent?: number
  extra_charges_percent?: number
  payment_terms?: string
  current_outstanding?: number
}

export interface ResellerFilters {
  status?: ResellerStatus
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface ResellerStats {
  new_registrations: number
  approved: number
  rejected: number
  suspended: number
  active: number
}

export interface ResellerOrder {
  id: string
  order_code: string
  total_price: number
  total_weight_kg: number
  status: string
  payment_status: string
  created_at: string
}

export interface Payment {
  id: string
  order_id: string | null
  reseller_id: string
  amount: number
  status: string
  payment_mode: string
  reference: string | null
  note: string | null
  due_date: string | null
  paid_at: string | null
  created_at: string
}

export interface Target {
  id: string
  reseller_id: string
  name: string
  type: string
  goal: number
  deadline: string
  reward_type: string
  reward_value: number
  status: string
  created_at: string
  updated_at: string
  current_progress?: number
}

export interface RecordPaymentInput {
  reseller_id: string
  order_id?: string
  amount: number
  payment_mode: string
  reference?: string
  note?: string
}

export interface CreateTargetInput {
  reseller_id: string
  name: string
  type: string
  goal: number
  deadline: string
  reward_type: string
  reward_value: number
}
