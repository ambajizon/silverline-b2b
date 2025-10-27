import { z } from 'zod'

export const silverRateSchema = z.object({
  per10g: z
    .number()
    .positive('Rate must be positive')
    .max(1000000, 'Rate exceeds maximum')
    .refine((val) => Number(val.toFixed(2)) === val || val.toString().split('.')[1]?.length <= 2, {
      message: 'Maximum 2 decimal places allowed',
    }),
})

export const companyInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_address: z.string().min(1, 'Address is required'),
  company_gstin: z.string().min(15, 'Valid GSTIN required').max(15, 'Valid GSTIN required'),
  company_phone: z.string().regex(/^\+?[0-9 -]{7,15}$/, 'Invalid phone format'),
})

export const gstConfigSchema = z.object({
  gst_enabled: z.boolean(),
  gst_rate: z.number().min(0, 'GST rate must be at least 0').max(28, 'GST rate cannot exceed 28'),
  company_gst_number: z.string().optional(),
  company_state_code: z.string().optional(),
}).refine(
  (data) => {
    // If GST is enabled, rate must be greater than 0
    if (data.gst_enabled) {
      return data.gst_rate > 0
    }
    return true
  },
  {
    message: 'GST rate must be greater than 0 when GST is enabled',
    path: ['gst_rate'],
  }
).refine(
  (data) => {
    // If GST is enabled, company GST number is recommended
    if (data.gst_enabled && data.company_gst_number && data.company_gst_number.trim() !== '') {
      // Validate GST format: 15 characters
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      return gstRegex.test(data.company_gst_number.trim().toUpperCase())
    }
    return true
  },
  {
    message: 'Invalid GST number format (e.g., 27AAAAA0000A1Z5)',
    path: ['company_gst_number'],
  }
)

export const jsonEditorSchema = z.object({
  content: z.string().refine(
    (val) => {
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    { message: 'Invalid JSON format' }
  ),
})

export const userRoleSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['admin', 'reseller', 'support', 'sales', 'inactive']),
})

export const addUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'reseller', 'support', 'sales']),
})

export const bulkRoleSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Select at least one user'),
  role: z.enum(['admin', 'reseller', 'support', 'sales', 'inactive']),
})
