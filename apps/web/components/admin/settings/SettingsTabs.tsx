'use client'

import { useRouter } from 'next/navigation'
import { SilverRate, Profile } from '@/types/settings'
import SilverRateTab from './SilverRateTab'
import CompanyInfoTab from './CompanyInfoTab'
import GstConfigTab from './GstConfigTab'
import SystemDefaultsTab from './SystemDefaultsTab'
import UserRoleTab from './UserRoleTab'
import SupportContactTab from './SupportContactTab'
import DangerZoneCard from './DangerZoneCard'

interface Reseller {
  id: string
  shop_name: string
  contact_name: string
  phone: string
}

interface SettingsTabsProps {
  activeTab: string
  currentRate: number
  rateHistory: SilverRate[]
  settings: Record<string, string>
  profiles: Profile[]
  supportContact: {
    name: string
    email: string
    phone: string
  }
  resellers: Reseller[]
}

const tabs = [
  { id: 'silver-rate', label: 'Silver Rate' },
  { id: 'company-info', label: 'Company Info' },
  { id: 'gst-configuration', label: 'GST Configuration' },
  { id: 'system-defaults', label: 'System Defaults' },
  { id: 'user-role-management', label: 'User Role Management' },
  { id: 'support-contact', label: 'Support Contact' },
  { id: 'danger-zone', label: 'Danger Zone' },
]

export default function SettingsTabs({
  activeTab,
  currentRate,
  rateHistory,
  settings,
  profiles,
  supportContact,
  resellers,
}: SettingsTabsProps) {
  const router = useRouter()

  const handleTabChange = (tabId: string) => {
    router.push(`/admin/settings?tab=${tabId}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Tabs Header */}
      <div className="border-b border-slate-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'silver-rate' && (
          <SilverRateTab currentRate={currentRate} rateHistory={rateHistory} />
        )}
        {activeTab === 'company-info' && <CompanyInfoTab settings={settings} />}
        {activeTab === 'gst-configuration' && <GstConfigTab settings={settings} />}
        {activeTab === 'system-defaults' && <SystemDefaultsTab settings={settings} />}
        {activeTab === 'user-role-management' && <UserRoleTab profiles={profiles} />}
        {activeTab === 'support-contact' && <SupportContactTab supportContact={supportContact} />}
        {activeTab === 'danger-zone' && <DangerZoneCard resellers={resellers} />}
      </div>
    </div>
  )
}
