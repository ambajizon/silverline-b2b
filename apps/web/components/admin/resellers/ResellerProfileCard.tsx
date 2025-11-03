'use client'

import { useState } from 'react'
import { ResellerWithProfile } from '@/types/resellers'
import UpdateStatusDropdown from './UpdateStatusDropdown'
import AdminLogoUploader from './AdminLogoUploader'
import EditProfileModal from './EditProfileModal'
import { Edit } from 'lucide-react'

interface ResellerProfileCardProps {
  reseller: ResellerWithProfile
}

export default function ResellerProfileCard({ reseller }: ResellerProfileCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
          <UpdateStatusDropdown resellerId={reseller.id} currentStatus={reseller.status} />
        </div>

      <div className="flex gap-6">
        {/* Logo Upload Area */}
        <div className="flex-shrink-0">
          <AdminLogoUploader
            resellerId={reseller.id}
            userId={reseller.user_id}
            currentUrl={reseller.logo_url}
            shopName={reseller.shop_name}
          />
        </div>

        {/* Details */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-600 mb-1">Business Name</p>
            <p className="font-medium text-slate-900">{reseller.shop_name}</p>
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-1">Contact Name</p>
            <p className="font-medium text-slate-900">{reseller.contact_name}</p>
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-1">Phone</p>
            <p className="font-medium text-slate-900">{reseller.phone}</p>
          </div>

          <div>
            <p className="text-xs text-slate-600 mb-1">Email</p>
            <p className="font-medium text-slate-900">{reseller.email}</p>
          </div>

          <div className="col-span-2">
            <p className="text-xs text-slate-600 mb-1">Address</p>
            <p className="font-medium text-slate-900">{reseller.address}</p>
          </div>
        </div>
      </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          resellerId={reseller.id}
          currentData={{
            shop_name: reseller.shop_name,
            contact_name: reseller.contact_name,
            phone: reseller.phone,
            address: reseller.address,
            city: reseller.city,
            state: reseller.state,
            pincode: reseller.pincode,
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  )
}
