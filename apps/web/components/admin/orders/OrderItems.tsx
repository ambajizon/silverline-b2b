'use client'

import { OrderItem } from '@/types/orders'
import { useState } from 'react'
import { formatCurrency, formatWeight } from '@/lib/pricing'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface OrderItemsProps {
  items: OrderItem[]
  gstRate: number
  silverRate: number
}

export default function OrderItems({ items, gstRate, silverRate }: OrderItemsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    const newSet = new Set(expandedItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setExpandedItems(newSet)
  }

  // Use stored pre-tax prices and calculate GST
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0)
  const gstAmount = subtotal * (gstRate / 100)
  const totalAmount = subtotal + gstAmount

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Items Breakdown</h2>

      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedItems.has(item.id)
          
          // Use stored price (pre-tax)
          const linePrice = item.price || 0
          const lineGst = linePrice * (gstRate / 100)
          const lineTotal = linePrice + lineGst
          
          // Get meta snapshot (with safety fallbacks)
          const meta = (item as any).meta || {}
          const weightGrams = (meta.weight_kg || item.weight_kg || 0) * 1000
          const ratePerGm = meta.rate_per_gm || silverRate || 0
          const deductionPct = meta.deduction_pct || 0
          const laborPerKg = meta.labor_per_kg || item.labor_per_kg || 0
          const offerApplied = meta.offer_applied || 0

          return (
            <div key={item.id} className="border border-slate-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{item.product_name}</h3>
                    <p className="text-sm text-slate-600 mt-1">Weight: {weightGrams} gm</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
                    >
                      View {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(lineTotal)}</p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Weight (gm)</p>
                      <p className="font-medium">{weightGrams.toFixed(0)} gm</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Rate/gram</p>
                      <p className="font-medium">{formatCurrency(ratePerGm)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Deduction %</p>
                      <p className="font-medium">{deductionPct.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Labor/kg</p>
                      <p className="font-medium">{formatCurrency(laborPerKg)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Subtotal (pre-GST)</p>
                      <p className="font-medium">{formatCurrency(linePrice)}</p>
                    </div>
                    {offerApplied > 0 && (
                      <div>
                        <p className="text-slate-600">Offer Discount</p>
                        <p className="font-medium text-emerald-600">-{formatCurrency(offerApplied)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-600">GST ({gstRate}%)</p>
                      <p className="font-medium">{formatCurrency(lineGst)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Line Total</p>
                      <p className="font-medium text-blue-600">{formatCurrency(lineTotal)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Grand Total</span>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  )
}
