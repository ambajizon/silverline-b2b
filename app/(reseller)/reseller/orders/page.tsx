import { getMyOrders } from './actions'
import OrdersList from '@/components/reseller/OrdersList'
import { OrderStatus } from '@/types/reseller'

export default async function ResellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: OrderStatus; search?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)
  
  const { items, total, kpis } = await getMyOrders({
    status: params.status,
    search: params.search,
    page,
    perPage: 20,
  })

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">My Orders</h1>
      
      <OrdersList 
        orders={items} 
        total={total} 
        kpis={kpis} 
        currentPage={page}
        currentStatus={params.status}
        currentSearch={params.search}
      />
    </div>
  )
}
