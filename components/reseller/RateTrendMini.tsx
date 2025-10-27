'use client'

import { RatePoint } from '@/types/reseller'

interface RateTrendMiniProps {
  points: RatePoint[]
}

export default function RateTrendMini({ points }: RateTrendMiniProps) {
  if (!points || points.length < 2) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Silver Rate Trend (7d)</h2>
        <p className="text-xs text-slate-500">Not enough data to display trend</p>
      </div>
    )
  }

  const width = 320
  const height = 60
  const rates = points.map(p => p.rate)
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  const range = max - min || 1

  // Generate SVG path
  const pathPoints = rates.map((value, index) => {
    const x = (index / (rates.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  const pathD = `M ${pathPoints.join(' L ')}`

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Silver Rate Trend (7d)</h2>
      
      <svg width={width} height={height} className="overflow-visible">
        {/* Gradient fill */}
        <defs>
          <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        <path
          d={`${pathD} L ${width},${height} L 0,${height} Z`}
          fill="url(#sparkGradient)"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
