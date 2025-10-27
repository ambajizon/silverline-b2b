'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, User } from 'lucide-react'
import { getCart } from '@/lib/cart'

import { ShoppingBag } from 'lucide-react'

const tabs = [
  {
    name: 'Dashboard',
    href: '/reseller',
    icon: LayoutDashboard,
  },
  {
    name: 'Catalog',
    href: '/reseller/products',
    icon: Package,
  },
  {
    name: 'Cart',
    href: '/reseller/cart',
    icon: ShoppingCart,
    showBadge: true,
  },
  {
    name: 'Orders',
    href: '/reseller/orders',
    icon: ShoppingBag,
  },
  {
    name: 'Account',
    href: '/reseller/account',
    icon: User,
  },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Update cart count on mount and when route changes
    const updateCart = () => {
      const cart = getCart()
      setCartCount(cart.totalQty)
    }

    updateCart()

    // Listen for storage events (in case cart is updated in another tab)
    window.addEventListener('storage', updateCart)
    
    // Custom event for same-tab updates
    window.addEventListener('cartUpdated', updateCart)

    return () => {
      window.removeEventListener('storage', updateCart)
      window.removeEventListener('cartUpdated', updateCart)
    }
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="max-w-[420px] mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href || (tab.href !== '/reseller' && pathname.startsWith(tab.href))

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-6 w-6 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {tab.showBadge && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {tab.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
      {/* Safe area padding for mobile devices */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </nav>
  )
}
