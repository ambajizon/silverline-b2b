'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportSalesCsv } from '@/app/(admin)/admin/reports/actions'
import { ReportFilters } from '@/types/reports'
import { toast } from 'sonner'

interface ExportButtonProps {
  filters: ReportFilters
}

export default function ExportButton({ filters }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)

    try {
      const result = await exportSalesCsv(filters)

      if (result.ok) {
        // Create a download link
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sales-report-${filters.date_range}-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success('Report exported successfully')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {exporting ? 'Exporting...' : 'Export Report'}
    </button>
  )
}
