export type TargetStatus = 'active' | 'in_progress' | 'completed' | 'expired' | 'suspended'
export type TargetType = 'purchase_value' | 'weight' | 'order_count' | 'category_specific' | 'revenue'
export type RewardType = 'cashback' | 'gift' | 'discount'

export interface Target {
  id: string
  reseller_id: string | null
  name: string
  type: TargetType
  goal: number
  deadline: string
  terms: string | null
  notes: string | null
  reward_type: RewardType | null
  reward_value: number | null
  status: TargetStatus
  open_participation: boolean
  created_at: string
  updated_at: string
}

export interface TargetWithProgress extends Target {
  reseller_name?: string
  current_progress: number
  progress_percentage: number
  is_qualified: boolean
}

export interface TargetProgress {
  id: string
  target_id: string
  current_value: number
  delta_value: number
  note: string | null
  updated_at: string
  updated_by?: string
}

export interface TargetDetail extends Target {
  reseller_name?: string
  reseller_email?: string
  current_progress: number
  progress_percentage: number
  is_qualified: boolean
  progress_history: TargetProgress[]
}

export interface TargetKPIs {
  active_challenges: number
  qualified_this_month: number
  not_qualified: number
  avg_progress: number
  expected_rewards: number
  roi: number
}

export interface TargetFilters {
  status?: TargetStatus
  type?: TargetType
  reseller_id?: string
  qualification?: 'any' | 'qualified' | 'not_qualified'
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateTargetInput {
  reseller_id?: string | null
  name: string
  type: TargetType
  goal: number
  deadline: string
  terms?: string
  notes?: string
  reward_type?: RewardType
  reward_value?: number
  open_participation?: boolean
}

export interface UpdateTargetInput extends Partial<CreateTargetInput> {
  id: string
  status?: TargetStatus
}
