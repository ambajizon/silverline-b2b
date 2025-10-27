import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTargetDetail } from '../actions'
import TargetDetailView from '@/components/admin/targets/TargetDetailView'

export default async function TargetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getTargetDetail(id)

  if (!result.ok || !result.data) {
    notFound()
  }

  const target = result.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/targets" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{target.name}</h1>
          <Link href="/admin/targets" className="text-sm text-blue-600 hover:underline">
            ← Back to Targets
          </Link>
        </div>
      </div>

      {/* Detail View */}
      <TargetDetailView target={target} />
    </div>
  )
}
