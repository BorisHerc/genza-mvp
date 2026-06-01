import type { TaskCategory } from '../types'
import { getCategoryLabel, pluralizeHr, translate } from './i18n'

export function getResponseTimeCopy(completedJobs: number) {
  if (completedJobs >= 10) return translate('trust.respondsWithinHours')
  if (completedJobs >= 3) return translate('trust.respondsFewHours')
  if (completedJobs >= 1) return translate('trust.respondsSameDayShort')
  return translate('trust.newTaskerQuick')
}

export function getCompletedJobsCopy(count: number) {
  if (count <= 0) return undefined
  if (translate('trust.completedJobsOne', { count: 1 }).includes('{{')) {
    return count === 1
      ? translate('trust.completedJobsOne', { count })
      : translate('trust.completedJobsMany', { count })
  }
  return pluralizeHr(
    count,
    translate('trust.completedJobsOne', { count }),
    translate('trust.completedJobsFew', { count }),
    translate('trust.completedJobsMany', { count }),
  )
}

export function getVerifiedCopy(verified?: boolean) {
  return verified ? translate('trust.verifiedTasker') : undefined
}

export function getPopularCategoryLabel(category: TaskCategory | null) {
  if (!category) return undefined
  const label = getCategoryLabel(category)
  return translate('trust.popularCategory', { label })
}

export type OfferTrustLineIcon = 'verified' | 'shield' | 'clock' | 'star'

export interface OfferTrustLine {
  text: string
  icon?: OfferTrustLineIcon
}

export function getOfferTrustLines(input: {
  verified?: boolean
  completedJobs?: number
  rating?: number
}): OfferTrustLine[] {
  const lines: OfferTrustLine[] = []
  const verified = getVerifiedCopy(input.verified)
  const jobs = getCompletedJobsCopy(input.completedJobs ?? 0)
  const response = getResponseTimeCopy(input.completedJobs ?? 0)

  if (verified) lines.push({ text: verified, icon: 'verified' })
  if (jobs) lines.push({ text: jobs, icon: 'shield' })
  if (response) lines.push({ text: response, icon: 'clock' })
  if ((input.rating ?? 0) >= 4.5) {
    lines.push({ text: translate('trust.highlyRated'), icon: 'star' })
  }

  return lines
}
