import { formatBudget as formatBudgetCurrency } from './currency'
import { getActiveLocale, translate } from './i18n'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return translate('time.justNow')
  if (diffMinutes < 60) return translate('time.minutesAgo', { count: diffMinutes })
  if (diffHours < 24) return translate('time.hoursAgo', { count: diffHours })
  if (diffDays === 1) return translate('time.yesterday')
  if (diffDays < 7) return translate('time.daysAgo', { count: diffDays })

  const localeTag = getActiveLocale() === 'hr' ? 'hr-BA' : 'en-US'
  return date.toLocaleDateString(localeTag, { month: 'short', day: 'numeric' })
}

export function formatBudget(
  amount: number,
  type: 'fixed' | 'hourly',
  currency?: import('./currency').SupportedCurrency,
) {
  return formatBudgetCurrency(amount, type, currency)
}

export { formatCurrency } from './currency'

export { getCategoryLabel } from './i18n'
