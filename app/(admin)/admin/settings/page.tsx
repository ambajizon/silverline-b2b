import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase-server'
import SettingsTabs from '@/components/admin/settings/SettingsTabs'
import { getCurrentSilverRate, fetchSilverRateHistory, getSettings, listProfiles, getSupportContact, getResellersForTesting } from './actions'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    redirect('/admin/dashboard')
  }

  const sp = await searchParams
  const activeTab = sp.tab || 'silver-rate'

  // Fetch initial data
  const [silverRateResult, rateHistoryResult, settingsResult, profilesResult, supportContactResult, resellersResult] = await Promise.all([
    getCurrentSilverRate(),
    fetchSilverRateHistory(10),
    getSettings(['company_name', 'company_address', 'company_gstin', 'company_phone', 'gst_rate', 'email_templates', 'notification_prefs']),
    listProfiles(),
    getSupportContact(),
    getResellersForTesting(),
  ])

  const currentRate = silverRateResult.ok ? silverRateResult.data || 0 : 0
  const rateHistory = rateHistoryResult.ok ? rateHistoryResult.data || [] : []
  const settings = settingsResult.ok ? settingsResult.data || {} : {}
  const profiles = profilesResult.ok ? profilesResult.data || [] : []
  const supportContact = supportContactResult.ok ? supportContactResult.data || { name: 'Support Team', email: 'support@company.com', phone: '+91 00000 00000' } : { name: 'Support Team', email: 'support@company.com', phone: '+91 00000 00000' }
  const resellers = resellersResult.ok ? resellersResult.data || [] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">Manage system settings and configuration</p>
      </div>

      <SettingsTabs
        activeTab={activeTab}
        currentRate={currentRate}
        rateHistory={rateHistory}
        settings={settings}
        profiles={profiles}
        supportContact={supportContact}
        resellers={resellers}
      />
    </div>
  )
}
