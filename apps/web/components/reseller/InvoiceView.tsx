'use client'

import { useRouter } from 'next/navigation'
import { X, Printer, Download } from 'lucide-react'
import { InvoiceData } from '@/types/reseller'

interface InvoiceViewProps {
  data: InvoiceData
}

export default function InvoiceView({ data }: InvoiceViewProps) {
  const router = useRouter()

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Future: Implement PDF download using html2pdf or similar
    alert('PDF download feature coming soon!')
  }

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Action Bar (no-print) */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Invoice Content (printable) */}
      <div className="bg-white rounded-lg p-6 border border-slate-200 print:border-0 print:shadow-none">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">INVOICE</h1>
          <p className="text-sm text-slate-600">Invoice #{data.order.order_number}</p>
        </div>

        {/* Company & Reseller Info */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          {/* From */}
          <div>
            <p className="font-semibold text-slate-900 mb-2">From:</p>
            <p className="font-bold text-slate-900">{data.company.name}</p>
            {data.company.address && <p className="text-slate-600">{data.company.address}</p>}
            {data.company.gstin && <p className="text-slate-600">GSTIN: {data.company.gstin}</p>}
            {data.company.phone && <p className="text-slate-600">Phone: {data.company.phone}</p>}
            {data.company.email && <p className="text-slate-600">Email: {data.company.email}</p>}
          </div>

          {/* To */}
          <div>
            <p className="font-semibold text-slate-900 mb-2">To:</p>
            <p className="font-bold text-slate-900">{data.reseller.name}</p>
            <p className="text-slate-600">{data.order.shipping_address}</p>
            <p className="text-slate-600">{data.order.shipping_city}, {data.order.shipping_state} {data.order.shipping_pincode}</p>
            <p className="text-slate-600">Phone: {data.order.shipping_phone}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-slate-50 p-4 rounded-lg">
          <div>
            <p className="text-slate-500 text-xs">Order Date</p>
            <p className="font-medium text-slate-900">{formatDate(data.order.created_at)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Status</p>
            <p className="font-medium text-slate-900 capitalize">{data.order.status}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-2 font-semibold text-slate-900">Item</th>
                <th className="text-center py-2 font-semibold text-slate-900">Weight</th>
                <th className="text-center py-2 font-semibold text-slate-900">Qty</th>
                <th className="text-right py-2 font-semibold text-slate-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.order.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-3">
                    <p className="font-medium text-slate-900">{item.product_name}</p>
                    <p className="text-xs text-slate-500">Tunch: {item.tunch_percentage}%</p>
                  </td>
                  <td className="text-center py-3 text-slate-700">{item.weight_kg}kg</td>
                  <td className="text-center py-3 text-slate-700">{item.quantity}</td>
                  <td className="text-right py-3 font-medium text-slate-900">
                    {formatINR(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between pb-2">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium text-slate-900">{formatINR(data.breakdown.subtotal)}</span>
          </div>
          {data.breakdown.gst_rate > 0 && (
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-600">GST ({data.breakdown.gst_rate}%)</span>
              <span className="font-medium text-slate-900">{formatINR(data.breakdown.gst_amount)}</span>
            </div>
          )}
          <div className={`flex justify-between pt-2 text-lg ${data.breakdown.gst_rate <= 0 ? 'border-t border-slate-200' : ''}`}>
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-bold text-blue-600">{formatINR(data.breakdown.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>Thank you for your business!</p>
          <p className="mt-2">This is a computer-generated invoice. No signature required.</p>
        </div>
      </div>
    </div>
  )
}
