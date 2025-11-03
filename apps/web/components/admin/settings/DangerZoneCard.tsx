'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { clearResellerData, clearAllResellersData } from '@/app/(admin)/admin/settings/actions'

interface Reseller {
  id: string
  shop_name: string
  contact_name: string
  phone: string
}

interface DangerZoneCardProps {
  resellers: Reseller[]
}

export default function DangerZoneCard({ resellers }: DangerZoneCardProps) {
  const [loading, setLoading] = useState(false)
  const [selectedReseller, setSelectedReseller] = useState('')

  const handleClearData = async () => {
    if (!selectedReseller) {
      toast.error('Please select a reseller')
      return
    }

    const reseller = resellers.find(r => r.id === selectedReseller)
    if (!reseller) return

    const confirmed = confirm(
      `⚠️ WARNING!\n\nThis will permanently delete ALL data for "${reseller.shop_name}":\n\n` +
      `✓ All orders\n` +
      `✓ All payments\n` +
      `✓ All targets\n` +
      `✓ All rewards\n\n` +
      `The reseller account will remain intact.\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you sure you want to proceed?`
    )

    if (!confirmed) return

    setLoading(true)

    const result = await clearResellerData(selectedReseller)

    if (result.ok) {
      const counts = result.data?.counts || {}
      toast.success(
        `Successfully cleared data!\n` +
        `Orders: ${counts.orders}\n` +
        `Payments: ${counts.payments}\n` +
        `Targets: ${counts.targets}\n` +
        `Rewards: ${counts.rewards}`
      )
      setSelectedReseller('')
      // Refresh page to show updated data
      setTimeout(() => window.location.reload(), 1500)
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  const handleClearAllData = async () => {
    const confirmed = confirm(
      `🚨 EXTREME CAUTION! 🚨\n\n` +
      `This will DELETE ALL DATA from ALL RESELLERS:\n\n` +
      `✓ ALL orders from ALL resellers\n` +
      `✓ ALL payments from ALL resellers\n` +
      `✓ ALL targets\n` +
      `✓ ALL rewards\n\n` +
      `All reseller accounts will remain intact.\n\n` +
      `This is for COMPLETE SYSTEM RESET!\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Type YES in the next prompt to confirm.`
    )

    if (!confirmed) return

    const doubleConfirm = prompt('Type YES (in capital letters) to confirm complete data wipe:')
    if (doubleConfirm !== 'YES') {
      toast.error('Cancelled - incorrect confirmation')
      return
    }

    setLoading(true)

    const result = await clearAllResellersData()

    if (result.ok) {
      const counts = result.data?.counts || {}
      toast.success(
        `🎉 Complete reset successful!\n` +
        `Orders: ${counts.orders}\n` +
        `Payments: ${counts.payments}\n` +
        `Targets: ${counts.targets}\n` +
        `Rewards: ${counts.rewards}\n\n` +
        `All reseller accounts preserved.`
      )
      // Refresh page to show clean state
      setTimeout(() => window.location.href = '/admin/dashboard', 1500)
    } else {
      toast.error(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        <p className="text-sm text-slate-600 mt-1">
          Proceed with caution. Actions here can affect all users.
        </p>
      </div>

      {/* Clear Reseller Data for Testing */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">🧪 Clear Reseller Data (Testing Only)</h3>
            <p className="text-sm text-red-700 mb-4">
              Remove all orders, payments, targets, and rewards for a specific reseller. The reseller account will remain intact for re-testing.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-red-900 mb-2">
                Select Reseller:
              </label>
              <select
                value={selectedReseller}
                onChange={(e) => setSelectedReseller(e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                disabled={loading}
              >
                <option value="">-- Choose a reseller --</option>
                {resellers.map((reseller) => (
                  <option key={reseller.id} value={reseller.id}>
                    {reseller.shop_name} ({reseller.contact_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
              <p className="text-xs text-red-800 font-medium mb-2">This will DELETE:</p>
              <ul className="text-xs text-red-700 space-y-1">
                <li>✓ All orders by this reseller</li>
                <li>✓ All order items (cascade)</li>
                <li>✓ All payments by this reseller</li>
                <li>✓ All targets assigned to them</li>
                <li>✓ All rewards claimed by them</li>
              </ul>
              <p className="text-xs text-red-800 font-medium mt-3 mb-1">This will KEEP:</p>
              <ul className="text-xs text-red-700 space-y-1">
                <li>✓ Reseller account (not deleted)</li>
                <li>✓ Login credentials intact</li>
                <li>✓ Can test again with clean slate</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleClearData}
          disabled={loading || !selectedReseller}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Trash2 className="h-4 w-4" />
          {loading ? 'Clearing Data...' : 'Clear Reseller Data'}
        </button>
      </div>

      {/* Clear ALL Resellers Data */}
      <div className="bg-red-900 border-2 border-red-600 rounded-lg p-6 max-w-2xl">
        <div className="flex items-start gap-3 mb-4">
          <XCircle className="h-6 w-6 text-red-100 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-100 mb-1 text-lg">🚨 CLEAR ALL DATA (SYSTEM RESET)</h3>
            <p className="text-sm text-red-200 mb-4">
              <strong>EXTREME CAUTION!</strong> This will delete ALL orders, payments, targets, and rewards from ALL resellers. Use only for complete system reset.
            </p>

            <div className="bg-red-800 border-2 border-red-500 rounded-md p-4 mb-4">
              <p className="text-xs text-red-100 font-bold mb-3">⚠️ THIS WILL DELETE:</p>
              <ul className="text-xs text-red-200 space-y-2">
                <li>• ALL orders from ALL resellers</li>
                <li>• ALL order items</li>
                <li>• ALL payments from ALL resellers</li>
                <li>• ALL targets (every reseller)</li>
                <li>• ALL rewards claimed</li>
              </ul>
              <p className="text-xs text-red-100 font-bold mt-4 mb-2">✅ THIS WILL KEEP:</p>
              <ul className="text-xs text-red-200 space-y-1">
                <li>• All reseller accounts</li>
                <li>• All login credentials</li>
                <li>• Products and categories</li>
                <li>• System settings</li>
              </ul>
            </div>

            <div className="bg-yellow-600 border border-yellow-400 rounded-md p-3 mb-4">
              <p className="text-xs text-yellow-50 font-semibold">
                ⚠️ Requires double confirmation with "YES" in capital letters
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClearAllData}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base shadow-lg border-2 border-red-400"
        >
          <XCircle className="h-5 w-5" />
          {loading ? 'Clearing ALL Data...' : 'CLEAR ALL DATA (SYSTEM RESET)'}
        </button>
      </div>

      {/* Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl">
        <p className="text-sm text-yellow-700">
          <strong>Note:</strong> These features are designed for testing purposes only. Use them to reset data without deleting accounts.
        </p>
      </div>
    </div>
  )
}
