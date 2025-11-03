import { getOrderDetail } from '../actions'
import OrderDetailView from '@/components/reseller/OrderDetailView'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetail(id)

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-4">
      <OrderDetailView order={order} />
    </div>
  )
}
