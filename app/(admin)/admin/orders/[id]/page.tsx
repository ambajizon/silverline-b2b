import { supabaseServer } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import OrderSummary from '@/components/admin/orders/OrderSummary'
import OrderItems from '@/components/admin/orders/OrderItems'
import OrderStatusUpdate from '@/components/admin/orders/OrderStatusUpdate'
import InvoiceButton from '@/components/admin/orders/InvoiceButton'
import PrintMOT from '@/components/admin/orders/PrintKOT'

async function fetchOrderDetail(orderId: string) {
  const supabase = await supabaseServer()

  try {
    // Fetch order with reseller
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        resellers!inner(shop_name, contact_name, phone, address)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    if (!order) return null

    // Fetch order items with correct schema
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id, order_id, product_id, product_name, product_image,
        weight_kg, weight_ranges,
        silver_rate, base_price, deduction_amount, labor_charges,
        discount_amount, global_loop_amount, gst_rate, gst_amount, item_total
      `)
      .eq('order_id', orderId)

    if (itemsError) throw itemsError

    // Fetch silver rate
    const { data: silverRate } = await supabase.rpc('get_current_silver_rate')

    // Fetch GST rate from settings
    const { data: gstSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'gst_rate')
      .maybeSingle()

    return {
      order: {
        ...order,
        reseller_name: order.resellers?.shop_name || 'Unknown',
        reseller: order.resellers,
      },
      items: (items || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        product_image: item.product_image || null,
        hsn_code: '', // Not stored in order_items
        weight_kg: Number(item.weight_kg || 0),
        weight_ranges: item.weight_ranges || null,
        quantity: 1,
        price: Number(item.item_total || 0),
        silver_rate: Number(item.silver_rate || 0),
        base_price: Number(item.base_price || 0),
        deduction_amount: Number(item.deduction_amount || 0),
        labor_charges: Number(item.labor_charges || 0),
        labor_per_kg: Number(item.labor_charges || 0),
        discount_amount: Number(item.discount_amount || 0),
        global_loop_amount: Number(item.global_loop_amount || 0),
        gst_rate: Number(item.gst_rate || 0),
        gst_amount: Number(item.gst_amount || 0),
        item_total: Number(item.item_total || 0),
        tunch_percentage: 0,
        offer_enabled: false,
        offer_type: 'none',
        offer_value: 0,
      })),
      gst_rate: Number(gstSetting?.value || 3),
      silver_rate: Number(silverRate || 0),
    }
  } catch (error) {
    console.error('Failed to fetch order detail:', error)
    return null
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchOrderDetail(id)
  
  if (!data) {
    notFound()
  }

  const { order, items, gst_rate, silver_rate } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Order #{order.order_code || `SL${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 4).toUpperCase()}`}
            </h1>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
              ← Back to Orders
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <PrintMOT 
            order={{
              id: order.id,
              order_code: order.order_code,
              status: order.status,
              created_at: order.created_at,
              reseller_name: order.reseller_name,
              notes: order.notes
            }}
            items={items}
          />
          <InvoiceButton order={order} items={items} gstRate={gst_rate} silverRate={silver_rate} />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <OrderSummary order={order} items={items} />
          <OrderItems items={items} gstRate={gst_rate} silverRate={silver_rate} />
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Shipping info stored in notes field */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Notes</h3>
            <div className="text-sm text-slate-600 whitespace-pre-wrap">
              {order.notes || 'No notes available'}
            </div>
          </div>
          <OrderStatusUpdate orderId={order.id} currentStatus={order.status} currentNotes={order.notes} />
        </div>
      </div>
    </div>
  )
}
