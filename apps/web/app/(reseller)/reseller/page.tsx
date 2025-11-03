import { redirect } from 'next/navigation'

export default function ResellerRootPage() {
  // Redirect to dashboard when accessing /reseller
  redirect('/reseller/dashboard')
}
