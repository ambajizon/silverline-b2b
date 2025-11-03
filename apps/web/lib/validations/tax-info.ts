import { z } from 'zod'

// GST Number validation (15 characters)
// Format: 2 digits (state code) + 10 chars (PAN) + 1 digit + 1 char + 1 char
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// PAN Number validation (10 characters)
// Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

// Aadhar Number validation (12 digits, with or without spaces)
const aadharRegex = /^[0-9]{12}$/
const aadharWithSpacesRegex = /^[0-9]{4}\s[0-9]{4}\s[0-9]{4}$/

export const taxInfoSchema = z.object({
  has_gst: z.boolean(),
  gst_number: z.string().optional(),
  pan_number: z.string().optional(),
  aadhar_number: z.string().optional(),
  business_name: z.string().min(2, 'Business/Person name must be at least 2 characters'),
  pan_holder_type: z.enum(['individual', 'proprietorship', 'partnership', 'company', 'trust', 'huf'], {
    message: 'Please select PAN holder type',
  }),
  tax_info_accepted: z.boolean(),
}).superRefine((data, ctx) => {
  // If has GST, GST number is mandatory
  if (data.has_gst) {
    if (!data.gst_number || data.gst_number.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GST number is required when GST registration is selected',
        path: ['gst_number'],
      })
    } else if (!gstRegex.test(data.gst_number.trim().toUpperCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid GST number format (e.g., 27AAAAA0000A1Z5)',
        path: ['gst_number'],
      })
    }
  } else {
    // If no GST, PAN is mandatory
    if (!data.pan_number || data.pan_number.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PAN number is mandatory if you don\'t have GST registration',
        path: ['pan_number'],
      })
    } else if (!panRegex.test(data.pan_number.trim().toUpperCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid PAN number format (e.g., ABCDE1234F)',
        path: ['pan_number'],
      })
    }
  }

  // Validate Aadhar if provided (optional)
  if (data.aadhar_number && data.aadhar_number.trim() !== '') {
    const cleanAadhar = data.aadhar_number.trim()
    if (!aadharRegex.test(cleanAadhar) && !aadharWithSpacesRegex.test(cleanAadhar)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid Aadhar number format (12 digits)',
        path: ['aadhar_number'],
      })
    }
  }

  // Tax info acceptance is mandatory
  if (!data.tax_info_accepted) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'You must accept that the information provided is correct',
      path: ['tax_info_accepted'],
    })
  }
})

export type TaxInfoInput = z.infer<typeof taxInfoSchema>

// Helper function to format GST number
export function formatGstNumber(gst: string): string {
  const cleaned = gst.replace(/[^A-Z0-9]/g, '').toUpperCase()
  return cleaned
}

// Helper function to format PAN number
export function formatPanNumber(pan: string): string {
  const cleaned = pan.replace(/[^A-Z0-9]/g, '').toUpperCase()
  return cleaned
}

// Helper function to format Aadhar number
export function formatAadharNumber(aadhar: string): string {
  const cleaned = aadhar.replace(/\D/g, '')
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`
  }
  return cleaned
}

// Helper to mask sensitive data for display
export function maskGstNumber(gst: string): string {
  if (gst.length !== 15) return gst
  return `${gst.slice(0, 2)}XXXXX${gst.slice(7, 12)}XXXX`
}

export function maskPanNumber(pan: string): string {
  if (pan.length !== 10) return pan
  return `${pan.slice(0, 3)}XXX${pan.slice(6, 10)}`
}

export function maskAadharNumber(aadhar: string): string {
  const cleaned = aadhar.replace(/\D/g, '')
  if (cleaned.length !== 12) return aadhar
  return `XXXX XXXX ${cleaned.slice(8, 12)}`
}
