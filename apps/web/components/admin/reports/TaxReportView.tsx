'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Calendar, TrendingUp, Receipt, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TaxReportProps {
  filters: {
    date_from: string
    date_to: string
    include_gst: boolean
    reseller_id?: string
  }
  summary: {
    totalOrders: number
    totalSales: number
    totalGST: number
    totalTaxable: number
    totalWeight: number
    period: {
      from: string
      to: string
    }
  }
  invoices: any[]
  payments: any[]
}

export default function TaxReportView({ filters, summary, invoices, payments }: TaxReportProps) {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState(filters.date_from)
  const [dateTo, setDateTo] = useState(filters.date_to)
  const [includeGST, setIncludeGST] = useState(filters.include_gst)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    params.set('date_from', dateFrom)
    params.set('date_to', dateTo)
    router.push(`/admin/reports/tax?${params.toString()}`)
  }

  const handleExportCSV = (type: 'invoices' | 'payments') => {
    const data = type === 'invoices' ? invoices : payments
    
    if (type === 'invoices') {
      // Export invoices
      const csvContent = [
        ['Date', 'Invoice No', 'Reseller', 'Subtotal', 'GST Amount', 'Total', 'Weight (kg)'].join(','),
        ...data.map((inv: any) => [
          formatDate(inv.created_at),
          inv.order_code,
          inv.resellers?.shop_name || 'N/A',
          inv.taxable_amount || 0,
          inv.gst_amount || 0,
          inv.total_price,
          inv.total_weight_kg,
        ].join(','))
      ].join('\n')

      downloadCSV(csvContent, `invoices_${dateFrom}_to_${dateTo}.csv`)
    } else {
      // Export payments
      const csvContent = [
        ['Date', 'Type', 'Reseller', 'Amount', 'Method', 'Transaction ID', 'Note'].join(','),
        ...data.map((pmt: any) => [
          formatDate(pmt.created_at),
          pmt.kind,
          pmt.resellers?.shop_name || 'N/A',
          pmt.amount,
          pmt.payment_method || 'N/A',
          pmt.transaction_id || 'N/A',
          `"${pmt.note || 'N/A'}"`,
        ].join(','))
      ].join('\n')

      downloadCSV(csvContent, `payments_${dateFrom}_to_${dateTo}.csv`)
    }
  }

  const handleExportPDF = async (type: 'invoices' | 'payments') => {
    // Dynamic import to avoid SSR issues
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    const data = type === 'invoices' ? invoices : payments

    // Helper to format numbers for PDF (without currency symbol, proper formatting)
    const formatNumber = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
      }).format(amount)
    }

    // Add title
    doc.setFontSize(18)
    doc.text('Invoice & Tax Report', 14, 20)
    
    // Add period
    doc.setFontSize(10)
    doc.text(`Period: ${formatDate(summary.period.from)} to ${formatDate(summary.period.to)}`, 14, 28)
    
    if (type === 'invoices') {
      // Add summary
      doc.text(`Total Invoices: ${summary.totalOrders}`, 14, 36)
      doc.text(`Total Sales: Rs ${formatNumber(summary.totalSales)}`, 14, 42)
      doc.text(`Total GST: Rs ${formatNumber(summary.totalGST)}`, 14, 48)
      
      // Invoice table
      autoTable(doc, {
        startY: 55,
        head: [['Date', 'Invoice No', 'Reseller', 'Subtotal (Rs)', 'GST (Rs)', 'Total (Rs)']],
        body: data.map((inv: any) => [
          formatDate(inv.created_at),
          inv.order_code,
          inv.resellers?.shop_name || 'N/A',
          formatNumber(inv.taxable_amount || 0),
          formatNumber(inv.gst_amount || 0),
          formatNumber(inv.total_price),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
      })
      
      doc.save(`invoices_${dateFrom}_to_${dateTo}.pdf`)
    } else {
      // Payment table
      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Type', 'Reseller', 'Amount (Rs)', 'Method', 'Transaction ID']],
        body: data.map((pmt: any) => [
          formatDate(pmt.created_at),
          pmt.kind,
          pmt.resellers?.shop_name || 'N/A',
          formatNumber(pmt.amount),
          pmt.payment_method || 'N/A',
          pmt.transaction_id || 'N/A',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          3: { halign: 'right' },
        },
      })
      
      doc.save(`payments_${dateFrom}_to_${dateTo}.pdf`)
    }
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoice & Tax Report</h1>
        <p className="text-sm text-slate-600">Generate comprehensive reports for CA and tax filing</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Invoices</p>
              <p className="text-xl font-bold text-slate-900">{summary.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Sales</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalSales)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Taxable Amount</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalTaxable)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Total GST</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(summary.totalGST)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
        <Calendar className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-900">Report Period</p>
          <p className="text-xs text-blue-700">
            {formatDate(summary.period.from)} to {formatDate(summary.period.to)}
          </p>
        </div>
      </div>

      {/* Invoice Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Invoice Details</h2>
            <p className="text-xs text-slate-600">{invoices.length} invoices in selected period</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCSV('invoices')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleExportPDF('invoices')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Invoice No</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Reseller</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Subtotal</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">GST</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-600">{formatDate(invoice.created_at)}</td>
                  <td className="py-3 px-4 text-sm font-medium text-blue-600">{invoice.order_code}</td>
                  <td className="py-3 px-4 text-sm text-slate-900">{invoice.resellers?.shop_name || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(invoice.taxable_amount || 0)}</td>
                  <td className="py-3 px-4 text-sm text-right text-slate-900">{formatCurrency(invoice.gst_amount || 0)}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900">{formatCurrency(invoice.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment Details</h2>
            <p className="text-xs text-slate-600">{payments.length} transactions in selected period</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCSV('payments')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleExportPDF('payments')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Reseller</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-700">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Method</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-700">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-600">{formatDate(payment.created_at)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      payment.kind === 'invoice' 
                        ? 'bg-red-100 text-red-700'
                        : payment.kind === 'payment'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {payment.kind}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-900">{payment.resellers?.shop_name || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900">{formatCurrency(payment.amount)}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 capitalize">{payment.payment_method?.replace('_', ' ') || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-mono">{payment.transaction_id || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-medium text-amber-900 mb-1">📋 For CA/Tax Filing</p>
        <p className="text-xs text-amber-800">
          These reports include all invoices (delivered orders) and payments received during the selected period.
          Export to CSV and share with your Chartered Accountant for GST filing and tax purposes.
        </p>
      </div>
    </div>
  )
}
