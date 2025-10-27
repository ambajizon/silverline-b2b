'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, clearCart } from '@/lib/cart'
import { placeOrder } from '@/app/(reseller)/reseller/cart/actions'
import { Cart } from '@/types/reseller'
import Image from 'next/image'
import { toPublicUrl } from '@/lib/images'
import Link from 'next/link'

interface CheckoutFormProps {
  defaultShipping: {
    full_name?: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
}

export default function CheckoutForm({ defaultShipping }: CheckoutFormProps) {
  const router = useRouter()
  const [cart, setCart] = useState<Cart>({ items: [], totalQty: 0, totalAmount: 0 })
  const [shipping, setShipping] = useState({
    full_name: defaultShipping.full_name || '',
    ...defaultShipping
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentCart = getCart()
    if (currentCart.items.length === 0) {
      router.push('/reseller/cart')
    }
    setCart(currentCart)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Build checkout payload
      const payload = {
        shipping: {
          full_name: shipping.full_name || 'Reseller',
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
          pincode: shipping.pincode,
          phone: shipping.phone,
        },
        items: cart.items.map(i => ({
          productId: i.productId,
          productName: i.name,           // ✅ Add product name
          productImage: i.image,         // ✅ Add product image
          weightKg: i.weightKg,
          total: i.total || i.price,
          preTaxTotal: i.preTaxTotal || i.total || i.price,
          silverRate: i.silverRate,
          deductionPct: i.deductionPct,
          laborPerKg: i.laborPerKg,
          offerDiscount: i.offerDiscount || 0,
          hsnCode: i.hsnCode || '',
          segments: i.segments?.map(s => ({
            range: s.range,
            weight_kg: s.weight_kg
          })) ?? [],
        })),
      }

      // Place order
      const result = await placeOrder(payload)

      // Clear cart
      clearCart()

      // Redirect to confirmation
      router.push(`/reseller/orders/${result.orderId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
      setLoading(false)
    }
  }

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (cart.items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center border border-slate-200">
        <p className="text-slate-600">Loading cart...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Shipping Address */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Shipping Address</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              readOnly
              value={shipping.full_name}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Address
            </label>
            <input
              type="text"
              required
              readOnly
              value={shipping.address}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                required
                readOnly
                value={shipping.city}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                required
                readOnly
                value={shipping.state}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                required
                pattern="[0-9]{6}"
                readOnly
                value={shipping.pincode}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                placeholder="6 digits"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                readOnly
                value={shipping.phone}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                placeholder="10 digits"
              />
            </div>
          </div>
        </div>

        {/* Change Address Link */}
        <div className="mt-3 pt-3 border-t border-slate-200 text-right">
          <Link
            href="/reseller/account"
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            Change shipping address in Account →
          </Link>
        </div>
      </div>

      {/* Order Review */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Order Review</h2>
        
        <div className="space-y-3 mb-4">
          {cart.items.map((item, idx) => (
            <div key={`${item.productId}-${item.weightKg}-${idx}`} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0">
              <div className="w-16 h-16 rounded bg-slate-100 flex-shrink-0 relative overflow-hidden">
                {item.image ? (
                  <Image src={toPublicUrl(item.image)} alt={item.name} fill className="object-cover" sizes="64px" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-900 truncate">{item.name}</h3>
                <p className="text-xs text-slate-500">
                  {item.weightKg.toFixed(3)}kg
                </p>
                {item.segments && item.segments.length > 0 && (
                  <p className="text-xs text-slate-400 truncate">
                    {item.segments.map(s => `${s.range.min}-${s.range.max}g: ${s.weight_kg}kg`).join(' • ')}
                  </p>
                )}
                <p className="text-sm font-semibold text-blue-600 mt-1">{formatINR(item.price)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-3 border-t border-slate-200">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total Items</span>
            <span className="font-medium text-slate-900">{cart.totalQty}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total Weight</span>
            <span className="font-medium text-slate-900">
              {cart.items.reduce((sum, i) => sum + i.weightKg, 0).toFixed(3)}kg
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-base font-semibold text-slate-900">Total Amount</span>
            <span className="text-xl font-bold text-blue-600">{formatINR(cart.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </form>
  )
}
