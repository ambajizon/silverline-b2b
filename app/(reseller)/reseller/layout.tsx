import React from 'react'
import { getResellerProfile } from './actions'
import BottomTabBar from '@/components/reseller/BottomTabBar'
import { Toaster } from 'sonner'

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  // Auth guard - will redirect if not authenticated or not reseller role
  await getResellerProfile()

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* Mobile container with bottom padding for tab bar */}
      <main className="min-h-screen pb-[calc(56px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      
      {/* Fixed Bottom Tab Bar */}
      <BottomTabBar />

      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  )
}
