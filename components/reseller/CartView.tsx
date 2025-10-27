'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingBag } from 'lucide-react'
import { getCart, clearCart, removeCartItem } from '@/lib/cart'
import { Cart } from '@/types/reseller'
import { toPublicUrl } from '@/lib/images'

export default function CartView() {
  const [cart, setCart] = useState<Cart>({ items: [], totalQty: 0, totalAmount: 0 })

  useEffect(() => {
    setCart(getCart())
  }, [])

  const handleRemove = (index: number) => {
    const updated = removeCartItem(index)
    setCart(updated)
  }

  const handleClear = () => {
    const updated = clearCart()
    setCart(updated)
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
      <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-slate-300 mb-3 stroke-1" />
        <p className="text-lg font-medium text-slate-900 mb-2">Your cart is empty</p>
        <p className="text-sm text-slate-600 mb-4">Add some products to get started</p>
        <Link
          href="/reseller/products"
          className="inline-block px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200">
        {cart.items.map((item, idx) => (
          <div key={`${item.productId}-${idx}`} className="p-4 flex gap-3">
            {/* Product Image */}
            <div className="w-20 h-20 rounded bg-slate-100 flex-shrink-0 relative overflow-hidden">
              {item.image ? (
                <Image
                  src={toPublicUrl(item.image)}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-900 mb-1 truncate">{item.name}</h3>
              
              {/* Total Weight */}
              <p className="text-xs text-slate-600 mb-1">
                <span className="font-medium">Total Weight:</span> {item.weightKg.toFixed(3)} kg
              </p>
              
              {/* Breakdown (if segments exist) */}
              {item.segments && item.segments.length > 0 && (
                <p className="text-xs text-slate-500 mb-2">
                  {item.segments.map((seg, i) => (
                    <span key={i}>
                      {seg.range.min}–{seg.range.max}g: {seg.weight_kg.toFixed(2)}kg
                      {i < item.segments!.length - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </p>
              )}
              
              <p className="text-base font-bold text-blue-600">{formatINR(item.price)}</p>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => handleRemove(idx)}
              className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded transition-colors self-start"
              aria-label="Remove item"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-600">Total Items</span>
          <span className="text-sm font-medium text-slate-900">{cart.totalQty}</span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <span className="text-base font-semibold text-slate-900">Total Amount</span>
          <span className="text-xl font-bold text-blue-600">{formatINR(cart.totalAmount)}</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-4">
          <Link
            href="/reseller/checkout"
            className="block w-full py-3 text-center text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Proceed to Checkout
          </Link>
          <button
            onClick={handleClear}
            className="w-full py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Continue Shopping */}
      <Link
        href="/reseller/products"
        className="block text-center text-sm text-blue-600 hover:underline"
      >
        Continue Shopping
      </Link>
    </div>
  )
}
