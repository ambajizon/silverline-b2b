import { z } from 'zod'

export const weightRangeSchema = z.object({
  min: z.number().min(0, 'Min weight must be >= 0'),
  max: z.number().min(0, 'Max weight must be >= 0'),
}).refine(data => data.max >= data.min, {
  message: 'Max weight must be >= min weight',
  path: ['max'],
})

export const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(0),
  category_id: z.string().uuid('Please select a category'),
  sub_category_id: z.string().optional(),
  tunch_percentage: z.number().min(0).max(100, 'Tunch must be between 0-100'),
  labor_per_kg: z.number().int('Labor must be a whole number').min(0, 'Labor must be >= 0'),
  weight_ranges: z.array(weightRangeSchema).min(0),
  images: z.array(z.string()).min(0),
  hsn_code: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  offer_enabled: z.boolean(),
  offer_type: z.enum(['percentage', 'fixed']).optional(),
  offer_value: z.number().min(0).optional(),
  offer_text: z.string().optional(),
  offer_valid_from: z.string().optional(),
  offer_valid_till: z.string().optional(),
}).refine(
  (data) => {
    if (data.offer_enabled) {
      return data.offer_type && data.offer_value && data.offer_value > 0
    }
    return true
  },
  {
    message: 'Offer type and value are required when offer is enabled',
    path: ['offer_value'],
  }
)

export type ProductFormInput = z.infer<typeof productFormSchema>
