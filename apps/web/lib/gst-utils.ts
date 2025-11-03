/**
 * GST Utilities for Indian Tax Compliance
 * Handles CGST/SGST/IGST calculation based on state codes
 */

export type GSTBreakdown = {
  is_gst_enabled: boolean
  is_same_state: boolean
  total_gst_rate: number
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_gst_amount: number
  company_state_code: string | null
  reseller_state_code: string | null
}

/**
 * Calculate GST breakdown based on state codes
 */
export function calculateGSTBreakdown(
  taxableAmount: number,
  gstRate: number,
  companyStateCode: string | null,
  resellerStateCode: string | null
): GSTBreakdown {
  // If GST is disabled (rate = 0)
  if (gstRate === 0) {
    return {
      is_gst_enabled: false,
      is_same_state: false,
      total_gst_rate: 0,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      total_gst_amount: 0,
      company_state_code: null,
      reseller_state_code: null,
    }
  }

  // Check if same state
  const isSameState = !!(
    companyStateCode &&
    resellerStateCode &&
    companyStateCode.trim() === resellerStateCode.trim()
  )

  let cgstRate = 0
  let sgstRate = 0
  let igstRate = 0

  if (isSameState) {
    // Same state: Split GST 50/50 into CGST and SGST
    cgstRate = gstRate / 2
    sgstRate = gstRate / 2
    igstRate = 0
  } else {
    // Different state or unknown: Use IGST
    cgstRate = 0
    sgstRate = 0
    igstRate = gstRate
  }

  const cgstAmount = (taxableAmount * cgstRate) / 100
  const sgstAmount = (taxableAmount * sgstRate) / 100
  const igstAmount = (taxableAmount * igstRate) / 100
  const totalGstAmount = cgstAmount + sgstAmount + igstAmount

  return {
    is_gst_enabled: true,
    is_same_state: isSameState,
    total_gst_rate: gstRate,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    igst_rate: igstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    total_gst_amount: totalGstAmount,
    company_state_code: companyStateCode,
    reseller_state_code: resellerStateCode,
  }
}

/**
 * Extract state code from GST number
 * GST format: 2 digits (state code) + 10 chars (PAN) + 3 chars
 */
export function extractStateCodeFromGST(gstNumber: string | null): string | null {
  if (!gstNumber || gstNumber.length < 2) {
    return null
  }
  return gstNumber.substring(0, 2)
}

/**
 * Get invoice title based on GST status
 */
export function getInvoiceTitle(isGstEnabled: boolean): string {
  return isGstEnabled ? 'Tax Invoice' : 'Estimate'
}

/**
 * Format GST number for display
 */
export function formatGSTForDisplay(gstNumber: string | null): string {
  if (!gstNumber) return 'N/A'
  // Add spaces for readability: 27 AAAAA 0000 A1Z5
  if (gstNumber.length === 15) {
    return `${gstNumber.slice(0, 2)} ${gstNumber.slice(2, 7)} ${gstNumber.slice(7, 11)} ${gstNumber.slice(11)}`
  }
  return gstNumber
}

/**
 * Get state name from state code
 */
export function getStateName(stateCode: string | null): string | null {
  if (!stateCode) return null
  
  const stateMap: Record<string, string> = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
  }
  
  return stateMap[stateCode] || null
}

/**
 * Validate state code
 */
export function isValidStateCode(stateCode: string | null): boolean {
  if (!stateCode) return false
  return getStateName(stateCode) !== null
}

/**
 * Format currency for Indian locale
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}
