'use client'

import { useState } from 'react'
import { updateShippingDetails } from '@/app/(admin)/admin/orders/actions'

interface ShippingDetailsProps {
  orderId: string
  shipName: string | null
  shipAddress: string | null
  shipCity: string | null
  shipState: string | null
  shipPincode: string | null
  shipPhone: string | null
}

export default function ShippingDetails({ 
  orderId, 
  shipName, 
  shipAddress, 
  shipCity, 
  shipState, 
  shipPincode, 
  shipPhone 
}: ShippingDetailsProps) {
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState(shipName || '')
  const [address, setAddress] = useState(shipAddress || '')
  const [city, setCity] = useState(shipCity || '')
  const [state, setState] = useState(shipState || '')
  const [pincode, setPincode] = useState(shipPincode || '')
  const [phone, setPhone] = useState(shipPhone || '')

  const handleSave = async () => {
    setLoading(true)
    const result = await updateShippingDetails(orderId, {
      ship_name: fullName,
      ship_address: address,
      ship_city: city,
      ship_state: state,
      ship_pincode: pincode,
      ship_phone: phone,
    })
    setLoading(false)

    if (result.success) {
      alert('Shipping details updated successfully')
    } else {
      alert(result.error || 'Failed to update shipping details')
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Shipping Details</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Enter full address"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Mumbai"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Maharashtra"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Pincode</label>
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            pattern="[0-9]{6}"
            maxLength={6}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="400001"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="+91 98765 43210"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
