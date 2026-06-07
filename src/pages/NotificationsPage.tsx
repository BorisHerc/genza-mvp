import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { NotificationListSkeleton } from '../components/ui/Skeletons'
import { NotificationItem } from '../components/notifications/NotificationItem'
import { useNotifications } from '../context/NotificationsContext'
import { useTranslation } from '../context/LocaleContext'
import { groupNotificationsByDate } from '../lib/notification-groups'

const GROUP_LABEL_KEYS = {
  today: 'notifications.groupToday',
  yesterday: 'notifications.groupYesterday',
  earlier: 'notifications.groupEarlier',
} as const

export function NotificationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { notifications, isLoading, error, markRead, markAllRead, refreshNotifications } =
    useNotifications()

  useEffect(() => {
    void refreshNotifications({ showLoading: true })
  }, [refreshNotifications])

  const grouped = groupNotificationsByDate(notifications)

  return (
    <div className="px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('notifications.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('notifications.subtitle')}</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <NotificationListSkeleton />
      ) : notifications.length === 0 && error ? (
        <ErrorState
          message={t('notifications.unavailableError', { error })}
          onAction={() => void refreshNotifications({ showLoading: true })}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title={t('notifications.emptyTitle')}
          description={t('notifications.emptyDescription')}
          actionLabel={t('messages.browseTasks')}
          onAction={() => navigate('/browse')}
        />
      ) : (
        <div className="space-y-6">
          {error && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t('notifications.partialRefreshWarning')}
            </p>
          )}
          {grouped.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t(GROUP_LABEL_KEYS[group.key])}
              </h2>
              <div className="space-y-3">
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={(id) => void markRead(id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
