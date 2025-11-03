'use client'

import { useEffect, useState } from 'react'
import { X, FileText } from 'lucide-react'
import { OrderItem } from '@/types/orders'
import { formatCurrency } from '@/lib/pricing'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface InvoiceModalProps {
  order: any
  items: OrderItem[]
  gstRate: number
  silverRate: number
  onClose: () => void
}

export default function InvoiceModal({ order, items, gstRate, silverRate, onClose }: InvoiceModalProps) {
  const [companyInfo, setCompanyInfo] = useState<any>({})

  useEffect(() => {
    // Fetch company info from settings
    const fetchSettings = async () => {
      const supabase = supabaseBrowser()
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['company_name', 'company_address', 'company_gstin', 'company_phone'])

      const settings: any = {}
      data?.forEach(s => {
        settings[s.key] = s.value
      })
      setCompanyInfo(settings)
    }
    fetchSettings()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    window.print()
  }

  // Use stored prices - NEVER recompute!
  // Subtotal = sum of item.price (pre-GST amounts)
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0)
  const totalGst = subtotal * (gstRate / 100)
  const deliveryCharges = 0 // Can be added from order if needed
  const grandTotal = subtotal + totalGst + deliveryCharges

  const invoiceNumber = `INV-SSJ-${new Date().getFullYear()}-${order.id.slice(0, 5).toUpperCase()}`
  const orderCode = order.order_code || `SL-ORD-${order.id.slice(0, 5).toUpperCase()}`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 print:hidden">
          <h2 className="text-xl font-semibold text-slate-900">Invoice Preview for Order #{orderCode}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-0" id="invoice-content">
          {/* Company and Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {companyInfo.company_name || 'Shree Savariya Jewelers'}
                </h3>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {companyInfo.company_address || '24, Dhan Vishon Ka Marg, Johari Bazar\nJaipur, Rajasthan, 302003, India'}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                GSTIN: {companyInfo.company_gstin || '08AABCS9012C1Z0'}
              </p>
              <p className="text-sm text-slate-600">
                Contact: {companyInfo.company_phone || '+91 9829012345'}
              </p>
            </div>

            {/* Customer Info */}
            <div className="text-right">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{order.reseller_name}</h3>
              {order.reseller && (
                <>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {order.reseller.address || 'Address not available'}
                  </p>
                  {order.reseller.phone && (
                    <p className="text-sm text-slate-600 mt-2">Contact: {order.reseller.phone}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-slate-600">Invoice No:</p>
              <p className="font-semibold text-slate-900">{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-600">Date:</p>
              <p className="font-semibold text-slate-900">
                {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-slate-600">Order ID:</p>
              <p className="font-semibold text-slate-900">{orderCode}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-600">Due Date:</p>
              <p className="font-semibold text-slate-900">
                {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 mb-3">Order Items</h4>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 font-medium text-slate-700">Product Name</th>
                  <th className="text-center py-2 font-medium text-slate-700">HSN</th>
                  <th className="text-right py-2 font-medium text-slate-700">Weight (gm)</th>
                  <th className="text-right py-2 font-medium text-slate-700">Rate (per gm)</th>
                  <th className="text-center py-2 font-medium text-slate-700">Deduction (%)</th>
                  <th className="text-right py-2 font-medium text-slate-700">Labor per kg</th>
                  <th className="text-right py-2 font-medium text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  // Use stored meta snapshot with safety fallbacks
                  const meta = (item as any).meta || {}
                  const weightGrams = (meta.weight_kg || item.weight_kg || 0) * 1000
                  const ratePerGm = meta.rate_per_gm || silverRate || 0
                  const hsnCode = meta.hsn_code || item.hsn_code || '7113'
                  const deductionPct = meta.deduction_pct || 0
                  const laborPerKg = meta.labor_per_kg || item.labor_per_kg || 0
                  const lineAmount = item.price || 0  // Pre-GST amount from snapshot
                  
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-3">{item.product_name || meta.product_name || 'Unknown Product'}</td>
                      <td className="py-3 text-center">{hsnCode}</td>
                      <td className="py-3 text-right">{weightGrams.toFixed(0)}</td>
                      <td className="py-3 text-right">{formatCurrency(ratePerGm)}</td>
                      <td className="py-3 text-center">{deductionPct.toFixed(2)}</td>
                      <td className="py-3 text-right">{formatCurrency(laborPerKg)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(lineAmount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Delivery Charges (if any) */}
          {deliveryCharges > 0 && (
            <div className="mb-6">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2" colSpan={6}>Delivery Charges</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(deliveryCharges)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600">GST ({gstRate}%):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalGst)}</span>
              </div>
              {deliveryCharges > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-200 text-blue-600">
                  <span>Delivery:</span>
                  <span className="font-semibold">{formatCurrency(deliveryCharges)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-slate-300">
                <span className="text-lg font-bold text-slate-900">Grand Total:</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            Close
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content, #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
