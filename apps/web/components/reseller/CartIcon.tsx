"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { getCart } from '@/lib/cart'

export default function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => setCount(getCart().totalQty)
    refresh()
    window.addEventListener('cartUpdated', refresh)
    return () => window.removeEventListener('cartUpdated', refresh)
  }, [])

  return (
    <Link href="/reseller/cart" className="relative inline-flex items-center">
      <ShoppingCart className="h-5 w-5 text-slate-700" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  )
}

