'use client'
import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface Notification {
  id: string
  type: 'order' | 'target' | 'reward' | 'announcement'
  title: string
  message: string
  created_at: string
  read: boolean
  related_id?: string
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time subscription for new notifications
    const supabase = supabaseBrowser()
    let subscription: any
    
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications()
          }
        )
        .subscribe()
    }
    
    setupSubscription()
    
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const fetchNotifications = async () => {
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const supabase = supabaseBrowser()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    fetchNotifications()
  }

  const markAllAsRead = async () => {
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    fetchNotifications()
  }

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'order':
        return `/reseller/orders/${notification.related_id}`
      case 'target':
        return `/reseller/targets`
      case 'reward':
        return `/reseller/targets`
      default:
        return null
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMins = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMs / 3600000)
    const diffInDays = Math.floor(diffInMs / 86400000)

    if (diffInMins < 1) return 'Just now'
    if (diffInMins < 60) return `${diffInMins}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-500'
      case 'target': return 'bg-purple-500'
      case 'reward': return 'bg-yellow-500'
      case 'announcement': return 'bg-green-500'
      default: return 'bg-slate-500'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && unreadCount > 0) {
            // Mark all as read when opening
            setTimeout(() => markAllAsRead(), 500)
          }
        }}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => {
                  const link = getNotificationLink(notification)
                  const content = (
                    <div className={`p-3 transition-colors ${
                      notification.read ? 'hover:bg-slate-50' : 'bg-blue-50 hover:bg-blue-100'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getTypeColor(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            notification.read ? 'text-slate-700' : 'text-slate-900'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatTime(notification.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )

                  return link ? (
                    <Link
                      key={notification.id}
                      href={link}
                      onClick={() => {
                        markAsRead(notification.id)
                        setIsOpen(false)
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id} onClick={() => markAsRead(notification.id)}>
                      {content}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
