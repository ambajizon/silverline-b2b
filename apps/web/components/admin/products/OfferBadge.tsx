import { OfferType } from '@/types/products'

interface OfferBadgeProps {
  enabled: boolean
  type: OfferType | null
  value: number | null
  text?: string | null
}

export default function OfferBadge({ enabled, type, value, text }: OfferBadgeProps) {
  if (!enabled || !value) {
    return <span className="text-slate-400 text-sm">-</span>
  }

  const displayText = text || (type === 'percentage' ? `${value}% OFF` : `₹${value} OFF`)

  return (
    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
      {displayText}
    </span>
  )
}
