import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AlertCircle, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

export default async function AccountBlockedPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get reseller info with status
  const { data: reseller } = await supabase
    .from('resellers')
    .select('shop_name, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const statusMessages: Record<string, { title: string; description: string; color: string }> = {
    pending: {
      title: 'Account Pending Approval',
      description: 'Your reseller account registration is currently under review by our admin team. You will be notified once your account is approved.',
      color: 'bg-yellow-50 border-yellow-200'
    },
    rejected: {
      title: 'Account Registration Rejected',
      description: 'Unfortunately, your reseller account registration has been rejected. Please contact our support team for more information.',
      color: 'bg-red-50 border-red-200'
    },
    suspended: {
      title: 'Account Suspended',
      description: 'Your reseller account has been temporarily suspended. Please contact our support team to resolve this issue.',
      color: 'bg-orange-50 border-orange-200'
    }
  }

  const statusInfo = statusMessages[reseller?.status || 'pending'] || statusMessages.pending

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className={`bg-white rounded-2xl shadow-xl border-2 ${statusInfo.color} p-8`}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-slate-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {statusInfo.title}
            </h1>
            {reseller?.shop_name && (
              <p className="text-sm text-slate-600 mb-4">
                Shop: <span className="font-medium">{reseller.shop_name}</span>
              </p>
            )}
            <p className="text-slate-600 leading-relaxed">
              {statusInfo.description}
            </p>
          </div>

          {/* Contact Support Section */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Contact Support</h2>
            <div className="space-y-3">
              <a
                href="mailto:support@example.com"
                className="flex items-center gap-3 text-sm text-slate-700 hover:text-blue-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>support@example.com</span>
              </a>
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 text-sm text-slate-700 hover:text-blue-600 transition-colors"
              >
                <Phone className="h-5 w-5" />
                <span>+91 98765 43210</span>
              </a>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              reseller?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              reseller?.status === 'rejected' ? 'bg-red-100 text-red-700' :
              reseller?.status === 'suspended' ? 'bg-orange-100 text-orange-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              Status: {reseller?.status || 'Unknown'}
            </span>
          </div>

          {/* Logout Button */}
          <a
            href="/auth/signout"
            className="mt-6 block w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-center"
          >
            Sign Out
          </a>

          {/* Home Link */}
          <div className="text-center mt-4">
            <Link 
              href="/" 
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          If you believe this is an error, please contact our support team immediately.
        </p>
      </div>
    </div>
  )
}
