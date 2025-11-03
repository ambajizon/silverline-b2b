import { getInvoiceData } from '../../actions'
import InvoiceView from '@/components/reseller/InvoiceView'

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoiceData = await getInvoiceData(id)

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-6 pt-4">
      <InvoiceView data={invoiceData} />
    </div>
  )
}
