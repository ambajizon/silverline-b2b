import { PriceBreakdown, OrderItem } from '@/types/orders'

interface PricingParams {
  weight_kg: number
  silver_rate: number
  tunch_percentage: number
  labor_per_kg: number
  extra_percent?: number
  offer_enabled?: boolean
  offer_type?: string | null
  offer_value?: number | null
  gst_rate: number
}

export function calculateLinePrice(params: PricingParams): PriceBreakdown {
  const {
    weight_kg,
    silver_rate,
    tunch_percentage,
    labor_per_kg,
    extra_percent = 2,
    offer_enabled = false,
    offer_type = null,
    offer_value = 0,
    gst_rate,
  } = params

  // Base = weight_kg * 1000 * silver_rate
  const base = weight_kg * 1000 * silver_rate

  // Deduction% = max(0, 100 - (tunch_percent + extra_percent))
  const deductionPercent = Math.max(0, 100 - (tunch_percentage + extra_percent))
  const deduction = base * (deductionPercent / 100)

  // Labor = labor_per_kg * weight_kg
  const labor = labor_per_kg * weight_kg

  // SubtotalBeforeOffer = Base - Deduction + Labor
  const subtotalBeforeOffer = base - deduction + labor

  // Offer calculation
  let offer = 0
  if (offer_enabled && offer_value) {
    if (offer_type === 'percentage') {
      offer = subtotalBeforeOffer * (offer_value / 100)
    } else if (offer_type === 'fixed') {
      offer = offer_value
    }
  }

  // SubtotalAfterOffer = SubtotalBeforeOffer - Offer
  const subtotalAfterOffer = subtotalBeforeOffer - offer

  // GST = SubtotalAfterOffer * (gst_rate/100)
  const gst = subtotalAfterOffer * (gst_rate / 100)

  // Line Total = SubtotalAfterOffer + GST
  const lineTotal = subtotalAfterOffer + gst

  return {
    base,
    deduction,
    labor,
    subtotalBeforeOffer,
    offer,
    subtotalAfterOffer,
    gst,
    lineTotal,
  }
}

export function calculateOrderTotals(
  items: OrderItem[],
  silver_rate: number,
  gst_rate: number,
  extra_percent: number = 2
) {
  let subtotal = 0
  let totalGst = 0
  let totalWeight = 0

  const itemsWithBreakdown = items.map(item => {
    const breakdown = calculateLinePrice({
      weight_kg: item.weight_kg,
      silver_rate,
      tunch_percentage: item.tunch_percentage,
      labor_per_kg: item.labor_per_kg,
      extra_percent,
      offer_enabled: item.offer_enabled,
      offer_type: item.offer_type,
      offer_value: item.offer_value || 0,
      gst_rate,
    })

    subtotal += breakdown.subtotalAfterOffer
    totalGst += breakdown.gst
    totalWeight += item.weight_kg

    return { ...item, breakdown }
  })

  return {
    items: itemsWithBreakdown,
    subtotal,
    totalGst,
    totalWeight,
    grandTotal: subtotal + totalGst,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatWeight(weightKg: number): string {
  const grams = Math.round(weightKg * 1000)
  return `${grams} gm`
}
