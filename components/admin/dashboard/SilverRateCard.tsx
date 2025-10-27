'use client'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface SilverRateCardProps {
  initialRate: number
}

export default function SilverRateCard({ initialRate }: SilverRateCardProps) {
  const [rate, setRate] = useState(initialRate)

  useEffect(() => {
    const supabase = supabaseBrowser()
    const channel = supabase
      .channel('silver_rates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'silver_rates' }, (payload) => {
        if (payload.new && 'rate_per_gram' in payload.new) {
          const newRate = Number(payload.new.rate_per_gram)
          setRate(newRate)
          // Optional: show toast notification
          console.log('Silver rate updated:', newRate)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 shadow-sm text-white">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-slate-300 text-sm font-medium mb-1">Live Silver Rate</p>
          <p className="text-3xl font-bold">{formatter.format(rate)}/gm</p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-yellow-400" />
        </div>
      </div>
      <Link
        href="/admin/settings?tab=silver-rate"
        className="inline-block mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
      >
        Update Rate
      </Link>
    </div>
  )
}
