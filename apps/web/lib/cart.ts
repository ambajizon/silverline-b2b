'use client'

import { Cart, CartItem } from '@/types/reseller'

const CART_COOKIE_KEY = 'reseller_cart'

export function getCart(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], totalQty: 0, totalAmount: 0 }
  }

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CART_COOKIE_KEY}=`))
  
  if (!cookie) {
    return { items: [], totalQty: 0, totalAmount: 0 }
  }

  try {
    const data = JSON.parse(decodeURIComponent(cookie.split('=')[1]))
    return data as Cart
  } catch {
    return { items: [], totalQty: 0, totalAmount: 0 }
  }
}

export function addToCart(item: CartItem): Cart {
  const cart = getCart()
  
  // Simply add new item (no duplicate checking since each can have different segments)
  cart.items.push(item)

  // Recalculate totals
  cart.totalQty = cart.items.length
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price, 0)

  // Save to cookie
  saveCart(cart)
  return cart
}

export function removeCartItem(index: number): Cart {
  const cart = getCart()
  
  if (index >= 0 && index < cart.items.length) {
    cart.items.splice(index, 1)
  }

  // Recalculate totals
  cart.totalQty = cart.items.length
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price, 0)

  saveCart(cart)
  return cart
}

export function removeFromCart(productId: string, weightKg: number): Cart {
  const cart = getCart()
  cart.items = cart.items.filter(i => !(i.productId === productId && i.weightKg === weightKg))
  
  // Recalculate totals
  cart.totalQty = cart.items.length
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price, 0)

  saveCart(cart)
  return cart
}

export function clearCart(): Cart {
  const emptyCart = { items: [], totalQty: 0, totalAmount: 0 }
  saveCart(emptyCart)
  return emptyCart
}

function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return

  const expires = new Date()
  expires.setDate(expires.getDate() + 7) // 7 days expiry

  document.cookie = `${CART_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(cart))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`

  // Dispatch custom event for cart updates
  window.dispatchEvent(new Event('cartUpdated'))
}
