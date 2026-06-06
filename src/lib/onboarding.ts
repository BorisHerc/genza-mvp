import type { OnboardingIntent, AuthProfile } from '../types/auth'
import type { ProfileRow } from '../types/database'
import { isValidStoredProfileRole } from './roles'

const VALID_INTENTS: OnboardingIntent[] = ['post', 'offer', 'both']

export function parseOnboardingIntent(value: unknown): OnboardingIntent | null {
  if (typeof value !== 'string') return null
  return VALID_INTENTS.includes(value as OnboardingIntent) ? (value as OnboardingIntent) : null
}

export function intentNeedsServiceSetup(intent: OnboardingIntent | null | undefined): boolean {
  return intent === 'offer' || intent === 'both'
}

export function isServiceProfileComplete(
  profile: Pick<AuthProfile, 'location' | 'serviceCategories'> | null | undefined,
): boolean {
  if (!profile) return false
  const hasLocation = Boolean(profile.location?.trim())
  const hasCategories = (profile.serviceCategories?.length ?? 0) > 0
  return hasLocation && hasCategories
}

/** Minimal gate: name + valid role — user may enter the app after skip. */
export function isProfileRowComplete(profile: ProfileRow | null | undefined): boolean {
  return Boolean(profile?.full_name?.trim() && isValidStoredProfileRole(profile.role))
}

export function shouldShowProfileCompletionReminder(
  user: AuthProfile | null | undefined,
  intent: OnboardingIntent | null | undefined,
): boolean {
  if (!user) return false

  if (intent === 'post') return false

  if (intent === 'offer' || intent === 'both') {
    return !isServiceProfileComplete(user)
  }

  // Legacy users without intent: nudge when service/location missing for nearby alerts
  const hasLocation = Boolean(user.location?.trim())
  const hasCategories = (user.serviceCategories?.length ?? 0) > 0
  return !hasLocation || !hasCategories
}

export function getOnboardingTotalSteps(_intent: OnboardingIntent | null): number {
  return 3
}

export function getOnboardingStepTitle(
  step: number,
  intent: OnboardingIntent | null,
  t: (key: string) => string,
): string {
  if (step === 1) return t('auth.onboardingIntentTitle')
  if (step === 2) return t('auth.profileSetup')
  if (intentNeedsServiceSetup(intent)) return t('auth.servicesSetup')
  return t('auth.locationSetup')
}

export function getOnboardingStepSubtitle(
  step: number,
  intent: OnboardingIntent | null,
  t: (key: string) => string,
): string {
  if (step === 1) return t('auth.onboardingIntentSubtitle')
  if (step === 2) return t('auth.profileSetupSubtitleDualRole')
  if (intentNeedsServiceSetup(intent)) return t('auth.servicesSetupSubtitle')
  return t('auth.locationSetupSubtitle')
}
