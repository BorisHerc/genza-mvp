import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_POLL_INTERVAL_MS,
  removeNotificationChannel,
  trySubscribeToNotifications,
} from '../lib/notifications'
import type { AppNotification } from '../types/marketplace'
import { useAuth } from './AuthContext'

interface RefreshOptions {
  showLoading?: boolean
}

interface NotificationsContextValue {
  notifications: AppNotification[]
  unreadCount: number
  unreadMessageCount: number
  isLoading: boolean
  error: string
  refreshNotifications: (options?: RefreshOptions) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const pollTimerRef = useRef<number | null>(null)

  const refreshNotifications = useCallback(async (options?: RefreshOptions) => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      setError('')
      return
    }

    if (options?.showLoading) setIsLoading(true)

    try {
      console.log('[Genza] refreshNotifications (before fetch)', {
        authUserId: user.id,
      })

      const [{ notifications: items, error: listError }, { count, error: countError }] =
        await Promise.all([
          listNotifications(user.id),
          getUnreadNotificationCount(user.id),
        ])

      setNotifications(items)
      const resolvedUnreadCount = !countError ? count : items.filter((item) => !item.read).length
      const resolvedUnreadMessageCount = items.filter(
        (item) => item.type === 'new_message' && !item.read,
      ).length

      if (!countError) {
        setUnreadCount(count)
      } else {
        setUnreadCount(resolvedUnreadCount)
      }
      setError(listError ?? '')

      console.log('[Genza] refreshNotifications (after fetch)', {
        authUserId: user.id,
        notificationCount: items.length,
        unreadCount: resolvedUnreadCount,
        listError: listError ?? null,
        countError: countError ?? null,
      })

      console.log('[Genza] unread message count', {
        authUserId: user.id,
        unreadMessageCount: resolvedUnreadMessageCount,
      })
    } catch (fetchError) {
      console.warn('[Genza] Failed to fetch notifications:', fetchError)
      setError('Unable to load notifications.')
    } finally {
      if (options?.showLoading) setIsLoading(false)
    }
  }, [user?.id])

  const startPolling = useCallback(() => {
    if (pollTimerRef.current !== null) return

    pollTimerRef.current = window.setInterval(() => {
      void refreshNotifications()
    }, NOTIFICATIONS_POLL_INTERVAL_MS)
  }, [refreshNotifications])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current === null) return
    window.clearInterval(pollTimerRef.current)
    pollTimerRef.current = null
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      stopPolling()
      setNotifications([])
      setUnreadCount(0)
      setError('')
      return
    }

    let channel: ReturnType<typeof trySubscribeToNotifications> = null
    let cancelled = false

    const sync = () => {
      if (!cancelled) void refreshNotifications()
    }

    // Initial fetch is non-blocking (no loading spinner).
    sync()

    try {
      channel = trySubscribeToNotifications(user.id, sync)
    } catch (subscribeError) {
      console.warn('[Genza] Notifications realtime setup failed:', subscribeError)
      channel = null
    }

    // Poll as a fallback when realtime is delayed or unavailable.
    startPolling()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void removeNotificationChannel(channel)
    }
  }, [isAuthenticated, user?.id, refreshNotifications, startPolling, stopPolling])

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id)
    await refreshNotifications()
  }, [refreshNotifications])

  const markAllRead = useCallback(async () => {
    if (!user) return
    await markAllNotificationsRead(user.id)
    await refreshNotifications()
  }, [user, refreshNotifications])

  const unreadMessageCount = useMemo(
    () => notifications.filter((item) => item.type === 'new_message' && !item.read).length,
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      unreadMessageCount,
      isLoading,
      error,
      refreshNotifications,
      markRead,
      markAllRead,
    }),
    [notifications, unreadCount, unreadMessageCount, isLoading, error, refreshNotifications, markRead, markAllRead],
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider')
  return context
}
