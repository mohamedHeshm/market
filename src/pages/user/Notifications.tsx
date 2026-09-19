import { Bell, CheckCheck } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/features/notifications/hooks'
import { EmptyState } from '@/components/common/States'
import { cn } from '@/lib/cn'

export default function NotificationsPage() {
  const { session } = useAuth()
  const { data: notifications, isLoading } = useNotifications(session?.user.id)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  if (!isLoading && (!notifications || notifications.length === 0)) {
    return <EmptyState title="لا توجد إشعارات" icon={<Bell size={22} />} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">الإشعارات</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => session?.user.id && markAll.mutate(session.user.id)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-700"
          >
            <CheckCheck size={15} /> تحديد الكل كمقروء
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {notifications?.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.is_read && markRead.mutate(n.id)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-card border p-3.5 text-start',
              n.is_read ? 'border-line bg-surface' : 'border-brand-300 bg-brand-50'
            )}
          >
            <span className="text-sm font-semibold text-ink">{n.title}</span>
            <span className="text-sm text-ink-soft">{n.message}</span>
            <span className="text-xs text-muted">{new Date(n.created_at).toLocaleString('ar-EG')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
