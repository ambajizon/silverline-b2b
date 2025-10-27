'use client'

import { useState } from 'react'
import { Printer } from 'lucide-react'
import InvoiceModal from './InvoiceModal'
import { OrderItem } from '@/types/orders'

interface InvoiceButtonProps {
  order: any
  items: OrderItem[]
  gstRate: number
  silverRate: number
}

export default function InvoiceButton({ order, items, gstRate, silverRate }: InvoiceButtonProps) {
  const [showInvoice, setShowInvoice] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowInvoice(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
      >
        <Printer className="h-4 w-4" />
        Print / Invoice
      </button>

      {showInvoice && (
        <InvoiceModal
          order={order}
          items={items}
          gstRate={gstRate}
          silverRate={silverRate}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  )
}
