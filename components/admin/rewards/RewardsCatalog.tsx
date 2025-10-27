'use client'

import { Package, Smartphone, Bike, Gem, DollarSign, Ticket } from 'lucide-react'

interface CatalogItem {
  id: string
  name: string
  description: string
  category: string
  cash_value: number
  is_physical: boolean
  total_stock: number
  available_stock: number
  is_active: boolean
}

export default function RewardsCatalog({ catalog }: { catalog: CatalogItem[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electronics':
        return <Smartphone className="h-5 w-5" />
      case 'vehicle':
        return <Bike className="h-5 w-5" />
      case 'jewelry':
        return <Gem className="h-5 w-5" />
      case 'cash':
        return <DollarSign className="h-5 w-5" />
      case 'voucher':
        return <Ticket className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'electronics':
        return 'bg-blue-100 text-blue-700'
      case 'vehicle':
        return 'bg-purple-100 text-purple-700'
      case 'jewelry':
        return 'bg-amber-100 text-amber-700'
      case 'cash':
        return 'bg-green-100 text-green-700'
      case 'voucher':
        return 'bg-cyan-100 text-cyan-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  // Group by category
  const groupedCatalog = catalog.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CatalogItem[]>)

  return (
    <div className="p-4">
      {Object.entries(groupedCatalog).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 capitalize flex items-center gap-2">
            <span className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
              {getCategoryIcon(category)}
            </span>
            {category.replace('_', ' ')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${
                  item.is_active
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                  {!item.is_active && (
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-600">Value</p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(item.cash_value)}
                    </p>
                  </div>

                  {item.is_physical && (
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Stock</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.available_stock} / {item.total_stock}
                      </p>
                    </div>
                  )}
                </div>

                {item.available_stock === 0 && item.is_physical && item.is_active && (
                  <div className="mt-2 text-xs bg-red-50 text-red-700 px-2 py-1 rounded text-center">
                    Out of Stock
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {catalog.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-slate-600">No rewards in catalog</p>
        </div>
      )}
    </div>
  )
}
