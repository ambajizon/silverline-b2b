import { OrderPipelineStatus } from '@/types/dashboard'

interface OrderPipelineProps {
  pipeline: OrderPipelineStatus
}

const stageConfig = [
  { key: 'pending', label: 'Pending', circleColor: 'bg-blue-500', textColor: 'text-blue-700' },
  { key: 'accepted', label: 'Accepted', circleColor: 'bg-blue-500', textColor: 'text-blue-700' },
  { key: 'making', label: 'Making', circleColor: 'bg-purple-500', textColor: 'text-purple-700' },
  { key: 'shipped', label: 'Shipped', circleColor: 'bg-cyan-500', textColor: 'text-cyan-700' },
  { key: 'delivered', label: 'Delivered', circleColor: 'bg-emerald-500', textColor: 'text-emerald-700' },
] as const

export default function OrderPipeline({ pipeline }: OrderPipelineProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Order Pipeline</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Cancelled:</span>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
            {pipeline.cancelled || 0}
          </span>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {stageConfig.map((stage, index) => {
            const count = pipeline[stage.key as keyof OrderPipelineStatus] || 0
            const isLast = index === stageConfig.length - 1
            
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div className={`w-12 h-12 rounded-full ${stage.circleColor} text-white flex items-center justify-center text-lg font-bold shadow-lg z-10`}>
                    {index + 1}
                  </div>
                  {/* Label and Count */}
                  <div className="mt-3 text-center">
                    <p className={`font-semibold ${stage.textColor}`}>{stage.label}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {count} {count === 1 ? 'Order' : 'Orders'}
                    </p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-1 bg-slate-300 -mx-6" style={{ marginTop: '-3rem' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
