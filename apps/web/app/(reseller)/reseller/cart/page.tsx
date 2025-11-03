import CartView from '@/components/reseller/CartView'

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">Shopping Cart</h1>
      
      <CartView />
    </div>
  )
}
