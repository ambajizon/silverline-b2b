import { getSupportContact } from './actions'
import { Phone, Mail, MessageCircle, Headphones, Clock, MapPin } from 'lucide-react'

export default async function SupportPage() {
  const contact = await getSupportContact()

  return (
    <div className="mx-auto max-w-[420px] px-3 pb-20 pt-3 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 p-3 rounded-full">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Need Help?</h1>
            <p className="text-sm text-orange-50">We're here for you</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Contact Support</h2>
        
        {/* Name */}
        <div className="flex items-start gap-3">
          <div className="bg-purple-50 p-2 rounded-lg">
            <MessageCircle className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-600 mb-0.5">Support Team</p>
            <p className="text-sm font-medium text-slate-900">{contact.name}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start gap-3">
          <div className="bg-green-50 p-2 rounded-lg">
            <Phone className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-600 mb-0.5">Phone Number</p>
            <a 
              href={`tel:${contact.phone}`}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              {contact.phone}
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-600 mb-0.5">Email Address</p>
            <a 
              href={`mailto:${contact.email}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 break-all"
            >
              {contact.email}
            </a>
          </div>
        </div>
      </div>

      {/* Call to Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${contact.phone}`}
          className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Phone className="h-5 w-5" />
          <span className="font-medium text-sm">Call Now</span>
        </a>
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Mail className="h-5 w-5" />
          <span className="font-medium text-sm">Send Email</span>
        </a>
      </div>

      {/* Office Hours */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Office Hours</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex justify-between">
            <span>Monday - Friday</span>
            <span className="font-medium">9:00 AM - 6:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span>Saturday</span>
            <span className="font-medium">10:00 AM - 4:00 PM</span>
          </div>
          <div className="flex justify-between">
            <span>Sunday</span>
            <span className="font-medium">Closed</span>
          </div>
        </div>
      </div>

      {/* FAQ Quick Links */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Common Questions</h3>
        <div className="space-y-2">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm text-slate-700 hover:text-slate-900 py-2 border-b border-slate-100">
              <span>How do I track my order?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-xs text-slate-600 mt-2 pb-2">
              Go to "Orders" tab and click on any order to see tracking details and current status.
            </p>
          </details>
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm text-slate-700 hover:text-slate-900 py-2 border-b border-slate-100">
              <span>How do I update my profile?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-xs text-slate-600 mt-2 pb-2">
              Navigate to "Account" tab and click "Edit Profile" to update your business information.
            </p>
          </details>
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm text-slate-700 hover:text-slate-900 py-2 border-b border-slate-100">
              <span>What are the payment terms?</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-xs text-slate-600 mt-2 pb-2">
              Payment terms are displayed in your Account section under Financial Details. Contact support to modify terms.
            </p>
          </details>
        </div>
      </div>
    </div>
  )
}
