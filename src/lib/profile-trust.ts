import { translate } from './i18n'

export interface ProfileCompletion {
  percent: number
  label: string
  missing: string[]
}

export function getProfileCompletion(profile: {
  fullName?: string | null
  full_name?: string | null
  location?: string | null
  avatarUrl?: string | null
  avatar_url?: string | null
  bio?: string | null
  skills?: string[] | null
  username?: string | null
}): ProfileCompletion {
  const checks = [
    {
      weight: 20,
      done: Boolean((profile.fullName ?? profile.full_name)?.trim()),
      label: translate('trust.fieldDisplayName'),
    },
    {
      weight: 20,
      done: Boolean(profile.location?.trim()),
      label: translate('trust.fieldCity'),
    },
    {
      weight: 20,
      done: Boolean(profile.avatarUrl ?? profile.avatar_url),
      label: translate('trust.fieldPhoto'),
    },
    {
      weight: 15,
      done: Boolean(profile.bio?.trim()),
      label: translate('trust.fieldBio'),
    },
    {
      weight: 15,
      done: Boolean(profile.skills?.length),
      label: translate('trust.fieldSkills'),
    },
    {
      weight: 10,
      done: Boolean(profile.username?.trim()),
      label: translate('trust.fieldUsername'),
    },
  ]

  const percent = checks.reduce((sum, check) => sum + (check.done ? check.weight : 0), 0)
  const missing = checks.filter((check) => !check.done).map((check) => check.label)

  return {
    percent,
    label:
      percent >= 100
        ? translate('trust.profileComplete')
        : percent >= 70
          ? translate('trust.profileAlmost')
          : translate('trust.profileInProgress'),
    missing,
  }
}

export function getTaskerResponseLabel(completedJobsCount: number): string {
  if (completedJobsCount >= 10) return translate('trust.respondsWithinHours')
  if (completedJobsCount >= 3) return translate('trust.respondsSameDayShort')
  if (completedJobsCount >= 1) return translate('trust.activeTasker')
  return translate('trust.newOnGenza')
}

export function getWelcomeStorageKey(userId: string) {
  return `Genza_welcome_dismissed_${userId}`
}

export function isWelcomeDismissed(userId: string) {
  return localStorage.getItem(getWelcomeStorageKey(userId)) === '1'
}

export function dismissWelcome(userId: string) {
  localStorage.setItem(getWelcomeStorageKey(userId), '1')
}
