import type { AppNotification } from '../types/marketplace'

export type NotificationDateGroup = 'today' | 'yesterday' | 'earlier'

export interface GroupedNotifications {
  key: NotificationDateGroup
  items: AppNotification[]
}

function startOfLocalDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function groupNotificationsByDate(notifications: AppNotification[]): GroupedNotifications[] {
  const todayStart = startOfLocalDay(new Date())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const buckets: Record<NotificationDateGroup, AppNotification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  }

  for (const notification of notifications) {
    const day = startOfLocalDay(new Date(notification.createdAt))

    if (day.getTime() === todayStart.getTime()) {
      buckets.today.push(notification)
    } else if (day.getTime() === yesterdayStart.getTime()) {
      buckets.yesterday.push(notification)
    } else {
      buckets.earlier.push(notification)
    }
  }

  return (['today', 'yesterday', 'earlier'] as const)
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, items: buckets[key] }))
}
