'use client'

import { useState } from 'react'
import { Printer, Share2 } from 'lucide-react'

interface OrderItem {
  id: string
  product_name: string
  product_image: string | null
  weight_kg: number
  weight_ranges?: any
  silver_rate: number
  base_price: number
  labor_charges: number
  item_total: number
}

interface PrintKOTProps {
  order: {
    id: string
    order_code: string
    status: string
    created_at: string
    reseller_name?: string
    notes?: string
  }
  items: OrderItem[]
}

export default function PrintMOT({ order, items }: PrintKOTProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    
    // Create print window
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print')
      setIsPrinting(false)
      return
    }

    const printContent = generateKOTHTML()
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Wait for images to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        setIsPrinting(false)
      }, 500)
    }
  }

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppMessage()
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const generateWhatsAppMessage = () => {
    const date = new Date(order.created_at).toLocaleDateString('en-IN')
    
    let message = `🔔 *NEW ORDER FOR MAKING*\n\n`
    message += `📋 *Order:* ${order.order_code}\n`
    message += `👤 *Customer:* ${order.reseller_name || 'Customer'}\n`
    message += `📅 *Date:* ${date}\n`
    message += `━━━━━━━━━━━━━━━━━━\n\n`
    
    items.forEach((item, index) => {
      message += `*${index + 1}. ${item.product_name}*\n`
      message += `   ⚖️ Weight: ${(item.weight_kg * 1000).toFixed(0)} gm\n`
      
      // Weight ranges if available
      if (item.weight_ranges && Array.isArray(item.weight_ranges)) {
        message += `   📊 Weight Breakdown:\n`
        item.weight_ranges.forEach((range: any) => {
          const rangeStr = range.range ? `${range.range.min}-${range.range.max}g` : 'Range'
          message += `      • ${rangeStr}: ${(range.weight_kg * 1000).toFixed(0)}g\n`
        })
      }
      
      message += `\n`
    })
    
    message += `━━━━━━━━━━━━━━━━━━\n`
    const totalWeight = items.reduce((sum, item) => sum + item.weight_kg, 0)
    message += `📦 *Total Weight:* ${(totalWeight * 1000).toFixed(0)} gm\n\n`
    
    if (order.notes) {
      message += `📝 *Notes:*\n${order.notes}\n\n`
    }
    
    message += `⚠️ Please confirm receipt and estimated completion time.`
    
    return message
  }

  const generateKOTHTML = () => {
    const date = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MOT - ${order.order_code}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .header h2 {
      font-size: 20px;
      font-weight: normal;
    }
    
    .order-info {
      margin-bottom: 20px;
      border-bottom: 1px dashed #000;
      padding-bottom: 15px;
    }
    
    .order-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 14px;
    }
    
    .order-info-row strong {
      font-weight: bold;
    }
    
    .items {
      margin-bottom: 20px;
    }
    
    .item {
      margin-bottom: 25px;
      padding: 15px;
      border: 2px solid #000;
      page-break-inside: avoid;
    }
    
    .item-header {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #000;
    }
    
    .item-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border: 1px solid #000;
      flex-shrink: 0;
    }
    
    .item-image-placeholder {
      width: 80px;
      height: 80px;
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      font-size: 10px;
      text-align: center;
      flex-shrink: 0;
    }
    
    .item-title {
      flex: 1;
    }
    
    .item-title h3 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .item-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      font-size: 13px;
    }
    
    .item-detail-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #ccc;
      padding: 5px 0;
    }
    
    .item-detail-label {
      font-weight: bold;
    }
    
    .weight-ranges {
      grid-column: 1 / -1;
      margin-top: 10px;
      padding: 10px;
      background: #f5f5f5;
      border: 1px solid #000;
    }
    
    .weight-ranges h4 {
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: bold;
    }
    
    .weight-range-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px dotted #999;
    }
    
    .weight-range-item:last-child {
      border-bottom: none;
    }
    
    .totals {
      border-top: 2px solid #000;
      padding-top: 15px;
      margin-top: 20px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    .total-row.grand {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #000;
      padding-top: 10px;
      margin-top: 10px;
    }
    
    .notes {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #000;
      background: #fffef0;
    }
    
    .notes h4 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .notes p {
      font-size: 12px;
      white-space: pre-wrap;
    }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      border-top: 1px dashed #000;
      padding-top: 15px;
    }
    
    @media print {
      body {
        padding: 10px;
      }
      
      .item {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>MAKING ORDER TICKET (MOT)</h1>
    <h2>Production Order</h2>
  </div>
  
  <div class="order-info">
    <div class="order-info-row">
      <strong>Order No:</strong>
      <span>${order.order_code}</span>
    </div>
    <div class="order-info-row">
      <strong>Customer:</strong>
      <span>${order.reseller_name || 'Customer'}</span>
    </div>
    <div class="order-info-row">
      <strong>Date & Time:</strong>
      <span>${date}</span>
    </div>
    <div class="order-info-row">
      <strong>Status:</strong>
      <span style="text-transform: uppercase;">${order.status}</span>
    </div>
  </div>
  
  <div class="items">
    ${items.map((item, index) => `
      <div class="item">
        <div class="item-header">
          ${item.product_image 
            ? `<img src="${item.product_image}" class="item-image" alt="${item.product_name}" />`
            : `<div class="item-image-placeholder">No Image</div>`
          }
          <div class="item-title">
            <h3>${index + 1}. ${item.product_name}</h3>
            <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">
              WEIGHT: ${(item.weight_kg * 1000).toFixed(0)} gm
            </div>
          </div>
        </div>
        
        <div class="item-details">
          ${item.weight_ranges && Array.isArray(item.weight_ranges) && item.weight_ranges.length > 0 ? `
            <div class="weight-ranges">
              <h4>📊 Weight Range Breakdown:</h4>
              ${item.weight_ranges.map((range: any) => {
                const rangeStr = range.range ? `${range.range.min}-${range.range.max}g` : 'Range'
                return `
                  <div class="weight-range-item">
                    <span>${rangeStr}</span>
                    <span><strong>${(range.weight_kg * 1000).toFixed(0)} gm</strong></span>
                  </div>
                `
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="totals">
    <div class="total-row">
      <span>Total Items:</span>
      <span><strong>${items.length}</strong></span>
    </div>
    <div class="total-row grand">
      <span>TOTAL WEIGHT:</span>
      <span><strong>${(items.reduce((sum, item) => sum + item.weight_kg, 0) * 1000).toFixed(0)} gm</strong></span>
    </div>
  </div>
  
  ${order.notes ? `
    <div class="notes">
      <h4>📝 NOTES / SPECIAL INSTRUCTIONS:</h4>
      <p>${order.notes}</p>
    </div>
  ` : ''}
  
  <div class="footer">
    <p><strong>⚠️ PLEASE VERIFY ALL DETAILS BEFORE STARTING PRODUCTION</strong></p>
    <p>Printed on: ${new Date().toLocaleString('en-IN')}</p>
  </div>
</body>
</html>
    `
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePrint}
        disabled={isPrinting}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Printer className="h-4 w-4" />
        {isPrinting ? 'Printing...' : 'Print MOT'}
      </button>
      
      <button
        onClick={handleShareWhatsApp}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Share on WhatsApp
      </button>
    </div>
  )
}
