'use client'

import { CategorySales } from '@/types/reports'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesByCategoryChartProps {
  data: CategorySales[]
}

export default function SalesByCategoryChart({ data }: SalesByCategoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="category_name"
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
        />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString(), 'Units']}
        />
        <Bar dataKey="units" fill="#2563eb" />
      </BarChart>
    </ResponsiveContainer>
  )
}
