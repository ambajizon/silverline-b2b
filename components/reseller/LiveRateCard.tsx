'use client'

import { useState, useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface LiveRateCardProps {
  rate: number
  updatedAt: string
  changePct: number | null
}

export default function LiveRateCard({ rate: initialRate, updatedAt: initialUpdatedAt, changePct: initialChangePct }: LiveRateCardProps) {
  const [rate, setRate] = useState(initialRate)
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
  const [changePct, setChangePct] = useState(initialChangePct)

  useEffect(() => {
    const supabase = supabaseBrowser()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('silver_rates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'silver_rates' },
        (payload) => {
          const newRate = payload.new as { rate_per_gram: number; created_at: string }
          
          // Only update if newer than current
          if (new Date(newRate.created_at) > new Date(updatedAt)) {
            setRate(newRate.rate_per_gram)
            setUpdatedAt(newRate.created_at)
            
            // Calculate new change percentage
            if (initialRate) {
              const change = ((newRate.rate_per_gram - initialRate) / initialRate) * 100
              setChangePct(change)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialRate, updatedAt])

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return 'N/A'
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const isPositive = (changePct ?? 0) >= 0

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-600">Live Silver Rate</h2>
        {changePct !== null && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isPositive
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            Last 24h {formatPercent(changePct)}
          </span>
        )}
      </div>

      {/* Rate */}
      <div className="mb-1">
        <span className="text-3xl font-bold text-blue-600">
          {formatINR(rate * 10)}
        </span>
        <span className="text-sm text-slate-500 ml-1">/10g</span>
      </div>

      <p className="text-xs text-slate-500">
        {isPositive ? "Looks like a good time to buy!" : "Rate decreased slightly"}
      </p>

      {/* Last updated */}
      <p className="text-xs text-slate-400 mt-2">
        Updated: {new Date(updatedAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  )
}
