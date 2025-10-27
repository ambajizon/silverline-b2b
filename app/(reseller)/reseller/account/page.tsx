import { getMyProfile, getTaxInfo } from './actions'
import ProfileHeader from '@/components/reseller/profile/ProfileHeader'
import ProfileInfoForm from '@/components/reseller/profile/ProfileInfoForm'
import FinancialDetailsCard from '@/components/reseller/profile/FinancialDetailsCard'
import TaxSettingsSection from '@/components/reseller/TaxSettingsSection'
import LogoutButton from '@/components/reseller/LogoutButton'

export default async function ResellerAccountPage() {
  const [profile, taxInfoResult] = await Promise.all([
    getMyProfile(),
    getTaxInfo(),
  ])
  
  const taxInfo = taxInfoResult.success ? taxInfoResult.data ?? null : null

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-20 pt-4">
      <h1 className="text-xl font-bold text-slate-900 mb-4">My Account</h1>
      
      <div className="space-y-4">
        {/* Profile Header with Avatar */}
        <ProfileHeader 
          shopName={profile.shop_name}
          logoUrl={profile.logo_url}
        />

        {/* Profile Info Form */}
        <ProfileInfoForm profile={profile} />

        {/* Tax Information */}
        <TaxSettingsSection initialData={taxInfo} />

        {/* Financial Details */}
        <FinancialDetailsCard
          creditLimit={profile.credit_limit}
          discountPercent={profile.discount_percent}
          extraChargesPercent={profile.extra_charges_percent}
          paymentTerms={profile.payment_terms}
        />

        {/* Logout Button */}
        <LogoutButton />
      </div>
    </div>
  )
}
