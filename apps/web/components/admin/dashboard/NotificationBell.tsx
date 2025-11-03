'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'order' | 'reseller' | 'payment'
  title: string
  message: string
  time: string
  link?: string
}

interface NotificationBellProps {
  notifications?: Notification[]
}

export default function NotificationBell({ notifications = [] }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Mock notifications if none provided
  const displayNotifications: Notification[] = notifications.length > 0 ? notifications : [
    {
      id: '1',
      type: 'order',
      title: 'New order received',
      message: 'Order #1001 from Ram Jewellery',
      time: '5 minutes ago',
      link: '/admin/orders/1001'
    },
    {
      id: '2',
      type: 'order',
      title: 'Order delivered',
      message: 'Order #1000 has been delivered',
      time: '2 hours ago',
      link: '/admin/orders/1000'
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-700" />
        {displayNotifications.length > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {displayNotifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No new notifications
                </div>
              ) : (
                displayNotifications.map((notification) => (
                  <div key={notification.id} className="p-3 hover:bg-slate-50 transition-colors">
                    {notification.link ? (
                      <Link href={notification.link} onClick={() => setIsOpen(false)}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notification.type === 'order' ? 'bg-blue-500' :
                            notification.type === 'reseller' ? 'bg-purple-500' :
                            'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notification.type === 'order' ? 'bg-blue-500' :
                          notification.type === 'reseller' ? 'bg-purple-500' :
                          'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
