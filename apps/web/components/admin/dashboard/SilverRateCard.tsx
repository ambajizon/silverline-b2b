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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-slate-200">
        <span className="text-sm text-slate-600 font-medium">Silver Rate</span>
        <span className="text-lg font-bold text-yellow-600">₹{rate.toFixed(2)}/gm</span>
      </div>
      <Link
        href="/admin/settings?tab=silver-rate"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Update Rate
      </Link>
    </div>
  )
}
