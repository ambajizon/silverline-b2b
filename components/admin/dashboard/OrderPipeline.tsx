import { OrderPipelineStatus } from '@/types/dashboard'

interface OrderPipelineProps {
  pipeline: OrderPipelineStatus
}

const statusConfig = [
  { key: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-700' },
  { key: 'processing', label: 'Processing', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700' },
  { key: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
] as const

export default function OrderPipeline({ pipeline }: OrderPipelineProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
      <h3 className="text-base font-semibold text-slate-900 mb-3">Order Pipeline</h3>
      <div className="flex flex-wrap gap-2">
        {statusConfig.map(({ key, label, color }) => {
          const count = pipeline[key as keyof OrderPipelineStatus] || 0
          return (
            <div key={key} className={`px-3 py-1.5 rounded-full ${color} text-sm font-medium flex items-center gap-1.5`}>
              <span>{label}</span>
              <span className="font-bold">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
