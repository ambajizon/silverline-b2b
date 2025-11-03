'use client'

import { Plus, Trash2 } from 'lucide-react'
import { WeightRange } from '@/types/products'

interface WeightRangesEditorProps {
  ranges: WeightRange[]
  onChange: (ranges: WeightRange[]) => void
}

export default function WeightRangesEditor({ ranges, onChange }: WeightRangesEditorProps) {
  const addRange = () => {
    onChange([...ranges, { min: 0, max: 0 }])
  }

  const removeRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index))
  }

  const updateRange = (index: number, field: 'min' | 'max', value: number) => {
    const newRanges = [...ranges]
    newRanges[index] = { ...newRanges[index], [field]: value }
    onChange(newRanges)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          These ranges can be used for display. Values are in grams.
        </p>
        <button
          type="button"
          onClick={addRange}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Range
        </button>
      </div>

      {ranges.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-400 text-sm">No weight ranges defined. Click "Add Range" to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranges.map((range, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-600 block mb-1">Min Weight (g)</label>
                  <input
                    type="number"
                    value={range.min}
                    onChange={(e) => updateRange(index, 'min', Number(e.target.value))}
                    placeholder="e.g., 30"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-600 block mb-1">Max Weight (g)</label>
                  <input
                    type="number"
                    value={range.max}
                    onChange={(e) => updateRange(index, 'max', Number(e.target.value))}
                    placeholder="e.g., 20"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRange(index)}
                className="mt-5 p-2 text-red-600 hover:bg-red-50 rounded-md"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
