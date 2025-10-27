'use client'

import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react'

interface PaymentSummary {
  invoiced: number
  received: number
  outstanding: number
  last_payment_date: string | null
  last_payment_amount: number
}

interface Payment {
  id: string
  kind: 'invoice' | 'payment' | 'adjustment'
  amount: number
  payment_date: string
  payment_method: string | null
  transaction_id: string | null
  note: string | null
  created_at: string
}

interface ResellerPaymentViewProps {
  summary: PaymentSummary
  history: Payment[]
}

export default function ResellerPaymentView({ summary, history }: ResellerPaymentViewProps) {
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

  const kindLabels = {
    invoice: 'Invoice',
    payment: 'Payment',
    adjustment: 'Adjustment',
  }

  const kindColors = {
    invoice: 'text-red-700 bg-red-100',
    payment: 'text-green-700 bg-green-100',
    adjustment: 'text-blue-700 bg-blue-100',
  }

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-20 pt-3 space-y-3">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-xl font-bold text-slate-900">Payment Account</h1>
        <p className="text-xs text-slate-600">Your payment balance & history</p>
      </div>

      {/* Outstanding Balance - Primary Card */}
      <div className={`rounded-lg p-4 shadow-sm border ${
        summary.outstanding > 0 
          ? 'bg-red-50 border-red-200' 
          : summary.outstanding < 0
          ? 'bg-cyan-50 border-cyan-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-xs font-medium mb-1 ${
              summary.outstanding > 0 
                ? 'text-red-600' 
                : summary.outstanding < 0
                ? 'text-cyan-600'
                : 'text-green-600'
            }`}>
              {summary.outstanding > 0 
                ? 'Amount Due' 
                : summary.outstanding < 0
                ? 'Credit Balance'
                : 'All Paid'}
            </p>
            <p className={`text-2xl font-bold ${
              summary.outstanding > 0 
                ? 'text-red-900' 
                : summary.outstanding < 0
                ? 'text-cyan-900'
                : 'text-green-900'
            }`}>
              {formatCurrency(Math.abs(summary.outstanding))}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            summary.outstanding > 0 
              ? 'bg-red-600' 
              : summary.outstanding < 0
              ? 'bg-cyan-600'
              : 'bg-green-600'
          }`}>
            {summary.outstanding > 0 ? (
              <TrendingDown className="h-6 w-6 text-white" />
            ) : (
              <Wallet className="h-6 w-6 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Invoiced */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-slate-600">Invoiced</p>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(summary.invoiced)}
          </p>
        </div>

        {/* Total Received */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-xs font-medium text-slate-600">Received</p>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(summary.received)}
          </p>
        </div>
      </div>

      {/* Last Payment Info */}
      {summary.last_payment_date && (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Last Payment</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(summary.last_payment_amount)}
          </p>
          <p className="text-xs text-slate-600">{formatDate(summary.last_payment_date)}</p>
        </div>
      )}

      {/* Important Note */}
      {summary.outstanding > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Payment Due</p>
          <p className="text-xs text-amber-800">
            Outstanding: {formatCurrency(summary.outstanding)}. Contact admin to make payment.
          </p>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Transaction History</h2>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 text-xs">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((payment) => (
              <div key={payment.id} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        kindColors[payment.kind]
                      }`}>
                        {kindLabels[payment.kind]}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDate(payment.created_at)}
                      </span>
                    </div>
                    
                    {payment.note && (
                      <p className="text-xs text-slate-700 mb-1 truncate">{payment.note}</p>
                    )}
                  </div>
                  
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className={`text-base font-bold ${
                      payment.kind === 'invoice' 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {payment.kind === 'invoice' ? '+' : '-'}{formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>

                {(payment.payment_method || payment.transaction_id) && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {payment.payment_method && (
                      <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                    )}
                    {payment.transaction_id && (
                      <span className="font-mono text-[9px]">{payment.transaction_id}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-900 mb-1">ℹ️ About Payments</p>
        <p className="text-xs text-blue-800">
          Invoices auto-create when orders delivered. Contact admin to make payments.
        </p>
      </div>
    </div>
  )
}
