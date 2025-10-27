'use client'

import LogoUploader from './LogoUploader'

interface ProfileHeaderProps {
  shopName: string
  logoUrl: string | null
}

export default function ProfileHeader({ shopName, logoUrl }: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Logo/Avatar */}
        <LogoUploader currentUrl={logoUrl} shopName={shopName} />

        {/* Business Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 truncate">
            {shopName || 'Your Business Name'}
          </h2>
          <p className="text-xs text-slate-500">Reseller Account</p>
        </div>
      </div>
    </div>
  )
}
