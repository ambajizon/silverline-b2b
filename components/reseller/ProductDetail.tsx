'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Download, X } from 'lucide-react'
import { Product, WeightSegment } from '@/types/reseller'
import { pricePreview } from '@/app/(reseller)/reseller/products/actions'
import { addToCart } from '@/lib/cart'
import { useRouter } from 'next/navigation'
import { toPublicUrl } from '@/lib/images'

interface ProductDetailProps {
  product: Product
  silverRate: { rate_per_gram: number; updated_at: string }
}

type SelectedSegment = {
  id: string
  range: { min: number; max: number }
  weight_kg: number
}

export default function ProductDetail({ product, silverRate }: ProductDetailProps) {
  const router = useRouter()
  const [selectedSegments, setSelectedSegments] = useState<SelectedSegment[]>([])
  const [breakdown, setBreakdown] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  // Calculate total weight from segments
  const totalWeightKg = selectedSegments.reduce((sum, seg) => sum + (seg.weight_kg || 0), 0)

  // Calculate price whenever segments change
  useEffect(() => {
    const calculatePrice = async () => {
      if (selectedSegments.length === 0 || totalWeightKg <= 0) {
        setBreakdown(null)
        return
      }

      setLoading(true)
      try {
        const result = await pricePreview({
          productId: product.id,
          segments: selectedSegments.map(s => ({
            range: s.range,
            weight_kg: s.weight_kg
          }))
        })
        setBreakdown(result)
      } catch (error) {
        console.error('Price calculation error:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(calculatePrice, 300)
    return () => clearTimeout(debounce)
  }, [selectedSegments, product.id, totalWeightKg])

  const handleAddRange = (range: { min: number; max: number }) => {
    const newSegment: SelectedSegment = {
      id: `${Date.now()}-${Math.random()}`,
      range,
      weight_kg: 0.01
    }
    setSelectedSegments([...selectedSegments, newSegment])
  }

  const handleRemoveSegment = (id: string) => {
    setSelectedSegments(selectedSegments.filter(s => s.id !== id))
  }

  const handleWeightChange = (id: string, weight: number) => {
    setSelectedSegments(selectedSegments.map(s =>
      s.id === id ? { ...s, weight_kg: Math.max(0, weight) } : s
    ))
  }

  const handleAddToCart = () => {
    if (!breakdown || selectedSegments.length === 0) return

    setAddingToCart(true)
    try {
      addToCart({
        productId: product.id,
        name: product.name,
        image: product.images[0] ?? null,
        weightKg: totalWeightKg,
        price: breakdown.total_price,  // backward compatibility
        total: breakdown.total_price,   // new field
        tunch: product.tunch_percentage,
        labor: product.labor_per_kg,
        offer: breakdown.offer_discount,
        segments: selectedSegments.map(s => ({
          range: s.range,
          weight_kg: s.weight_kg
        }))
      })

      // Redirect to cart
      router.push('/reseller/cart')
    } catch (error) {
      console.error('Add to cart error:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link
        href="/reseller/products"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      {/* Product Images */}
      <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
        <div className="aspect-square bg-slate-100 relative">
          {product.images.length > 0 ? (
            <Image
              src={toPublicUrl(product.images[0])}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 420px) 100vw, 420px"
              unoptimized
              priority
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {product.images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {product.images.slice(0, 4).map((img, idx) => (
              <div key={idx} className="w-16 h-16 rounded border border-slate-200 overflow-hidden flex-shrink-0 relative">
                <Image src={toPublicUrl(img)} alt="" fill className="object-cover" sizes="64px" unoptimized />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
        <h1 className="text-lg font-bold text-slate-900">{product.name}</h1>
        
        {product.description && (
          <p className="text-sm text-slate-600">{product.description}</p>
        )}

        {/* Weight Ranges */}
        {product.weight_ranges && product.weight_ranges.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Weight Ranges</p>
            <div className="flex gap-2 flex-wrap">
              {product.weight_ranges.map((range, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                  {range.min}–{range.max}{range.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Product Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Tunch</p>
            <p className="font-medium text-slate-900">{product.tunch_percentage}%</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Labor Rate</p>
            <p className="font-medium text-slate-900">{formatINR(product.labor_per_kg)}/kg</p>
          </div>
          {product.hsn_code && (
            <div>
              <p className="text-slate-500 text-xs">HSN Code</p>
              <p className="font-medium text-slate-900">{product.hsn_code}</p>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Range Weight Selector */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Select Weight Ranges
          </label>
          {product.weight_ranges && product.weight_ranges.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {product.weight_ranges.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddRange({ min: range.min, max: range.max })}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  + {range.min}–{range.max}{range.unit}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Segments */}
        {selectedSegments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Selected Ranges:</p>
            {selectedSegments.map((segment) => (
              <div key={segment.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <span className="text-xs font-medium text-slate-700 min-w-[70px]">
                  {segment.range.min}–{segment.range.max}g
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={segment.weight_kg}
                  onChange={(e) => handleWeightChange(segment.id, parseFloat(e.target.value) || 0)}
                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Weight (kg)"
                />
                <span className="text-xs text-slate-500">kg</span>
                <button
                  onClick={() => handleRemoveSegment(segment.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {/* Total Weight Display */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-700">Total Weight:</span>
              <span className="text-sm font-bold text-blue-600">{totalWeightKg.toFixed(3)} kg</span>
            </div>
          </div>
        )}

        {selectedSegments.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-2">
            Click a range above to add it
          </p>
        )}
      </div>

      {/* Price Breakdown */}
      {loading && (
        <div className="bg-white rounded-lg p-4 border border-slate-200 text-center text-sm text-slate-500">
          Calculating...
        </div>
      )}
      
      {!loading && breakdown && (
        <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Price Breakdown</h3>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Weight</span>
            <span className="font-medium text-slate-900">{breakdown.weight_kg.toFixed(3)} kg</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Silver Rate</span>
            <span className="font-medium text-slate-900">{formatINR(breakdown.silver_rate)}/g</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Base Price</span>
            <span className="font-medium text-slate-900">{formatINR(breakdown.base_price)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Deduction ({breakdown.deduction_pct.toFixed(1)}%)</span>
            <span className="font-medium text-red-600">-{formatINR(breakdown.deduction_amount)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Labor Charges</span>
            <span className="font-medium text-slate-900">+{formatINR(breakdown.labor_charges)}</span>
          </div>
          
          {breakdown.reseller_discount_pct && breakdown.reseller_discount_pct > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Discount ({breakdown.reseller_discount_pct}%)</span>
              <span className="font-medium text-green-600">-{formatINR(breakdown.reseller_discount_amount!)}</span>
            </div>
          )}
          
          {breakdown.global_loop_pct && breakdown.global_loop_pct > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Global Loop ({breakdown.global_loop_pct}%)</span>
              <span className="font-medium text-blue-600">+{formatINR(breakdown.global_loop_amount!)}</span>
            </div>
          )}
          
          {breakdown.offer_discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Offer Discount</span>
              <span className="font-medium text-orange-600">-{formatINR(breakdown.offer_discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
            <span className="text-slate-600">Taxable Amount</span>
            <span className="font-medium text-slate-900">{formatINR(breakdown.taxable_amount)}</span>
          </div>
          
          {breakdown.is_gst_enabled && breakdown.gst_rate > 0 && (
            <>
              {breakdown.is_same_state ? (
                <>
                  {/* Same State: Show CGST + SGST */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">CGST ({breakdown.cgst_rate}%)</span>
                    <span className="font-medium text-slate-900">+{formatINR(breakdown.cgst_amount!)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">SGST ({breakdown.sgst_rate}%)</span>
                    <span className="font-medium text-slate-900">+{formatINR(breakdown.sgst_amount!)}</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Different State: Show IGST */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">IGST ({breakdown.igst_rate}%)</span>
                    <span className="font-medium text-slate-900">+{formatINR(breakdown.igst_amount!)}</span>
                  </div>
                </>
              )}
            </>
          )}
          
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
            <span className="text-slate-900">Total Price</span>
            <span className="text-blue-600">{formatINR(breakdown.total_price)}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleAddToCart}
          disabled={!breakdown || addingToCart || selectedSegments.length === 0 || totalWeightKg <= 0}
          className="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
        
        <button
          disabled
          className="w-full py-3 text-sm font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Marketing Material (Coming Soon)
        </button>
      </div>
    </div>
  )
}
