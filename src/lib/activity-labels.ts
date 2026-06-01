import type { TaskCategory } from '../types'
import { translate } from './i18n'
import { formatRelativeTime } from './utils'

export function getTaskInterestLabel(offerCount: number) {
  if (offerCount >= 3) return translate('tasks.interest.manyOffers', { count: offerCount })
  if (offerCount === 2) return translate('tasks.interest.twoOffers')
  if (offerCount === 1) return translate('tasks.interest.oneOffer')
  return undefined
}

export function getLocalPopularityLabel(location: string, offerCount: number) {
  const city = location.split(',')[0]?.trim() || location
  if (offerCount >= 2) return translate('tasks.popularity.inCity', { city })
  return undefined
}

export function getFreshnessLabel(postedAt: string) {
  const relative = formatRelativeTime(postedAt)
  if (relative === translate('time.justNow')) return translate('tasks.freshness.justNow')
  return translate('tasks.freshness.relative', { time: relative })
}

export function getResponseTimeShort(completedJobs: number) {
  if (completedJobs >= 10) return translate('trust.responds10min')
  if (completedJobs >= 5) return translate('trust.responds30min')
  if (completedJobs >= 2) return translate('trust.responds1h')
  if (completedJobs >= 1) return translate('trust.respondsSameDay')
  return translate('trust.newTaskerQuick')
}

export interface ActivityFeedItem {
  id: string
  label: string
  detail: string
  time: string
}

export function buildTaskActivityFeed(
  tasks: Array<{ id: string; title: string; offerCount: number; postedAt: string; location: string; category: TaskCategory }>,
): ActivityFeedItem[] {
  return tasks.slice(0, 6).map((task) => ({
    id: task.id,
    label: getTaskInterestLabel(task.offerCount) ?? getFreshnessLabel(task.postedAt),
    detail: task.title,
    time: formatRelativeTime(task.postedAt),
  }))
}

export interface TrendingCategory {
  category: TaskCategory | 'all'
  label: string
  icon: string
  count: number
}

export function rankTrendingCategories(
  tasks: Array<{ category: TaskCategory }>,
  icons: Record<string, string>,
  labels: Record<string, string>,
): TrendingCategory[] {
  const counts = new Map<TaskCategory, number>()
  for (const task of tasks) {
    counts.set(task.category, (counts.get(task.category) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, count]) => ({
      category,
      label: labels[category] ?? category,
      icon: icons[category] ?? '💡',
      count,
    }))
}
