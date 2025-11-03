export interface SilverRate {
  id: string
  rate_per_gram: number
  created_at: string
  updated_by: string | null
  updated_by_email?: string
}

export interface Setting {
  id: number
  key: string
  value: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'reseller' | 'support' | 'sales' | 'inactive'
  created_at: string
  updated_at?: string
}

export interface CompanyInfo {
  company_name: string
  company_address: string
  company_gstin: string
  company_phone: string
}

export interface GstConfig {
  gst_enabled: boolean
  gst_rate: number
}

export interface EmailTemplates {
  [key: string]: string
}

export interface NotificationPrefs {
  [key: string]: boolean | string
}

export type UserRole = 'admin' | 'reseller' | 'support' | 'sales' | 'inactive'
