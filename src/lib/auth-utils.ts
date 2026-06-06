import type { User } from '@supabase/supabase-js'
import type { AuthProfile, ProfileSetupData } from '../types/auth'
import type { ProfileRow } from '../types/database'
import { isSupportedCurrency } from './currency'
import { translate } from './i18n'
import { isProfileRowComplete, parseOnboardingIntent } from './onboarding'
import {
  DEFAULT_PROFILE_ROLE,
  isValidStoredProfileRole,
  normalizeSystemRole,
} from './roles'

export function getUserMetadata(user: User) {
  return (user.user_metadata ?? {}) as Record<string, unknown>
}

export function isProfileComplete(
  user: User | null | undefined,
  profileRow?: ProfileRow | null,
): boolean {
  if (!user) return false
  if (isProfileRowComplete(profileRow)) return true

  const metadata = getUserMetadata(user)
  const metadataRole = metadata.role
  return Boolean(
    metadata.profile_complete &&
      metadata.full_name &&
      isValidStoredProfileRole(typeof metadataRole === 'string' ? metadataRole : null),
  )
}

export function mapUserToProfile(user: User, profileRow?: ProfileRow | null): AuthProfile {
  const metadata = getUserMetadata(user)
  const metadataLocation = metadata.location ?? metadata.city
  const storedRole = profileRow?.role ?? (typeof metadata.role === 'string' ? metadata.role : null)

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profileRow?.full_name?.trim() || String(metadata.full_name ?? ''),
    phone: String(metadata.phone ?? ''),
    location:
      profileRow?.location?.trim() ||
      String(metadataLocation ?? ''),
    neighborhood: profileRow?.neighborhood?.trim() || undefined,
    latitude: profileRow?.latitude ?? null,
    longitude: profileRow?.longitude ?? null,
    serviceCategories: (profileRow?.service_categories ?? []).filter(
      (value): value is import('../types').TaskCategory => typeof value === 'string',
    ),
    startingPrices: (profileRow?.starting_prices as import('../types/auth').StartingPrices) ?? {},
    availabilityEnabled: profileRow?.availability_enabled !== false,
    onboardingIntent: parseOnboardingIntent(metadata.onboarding_intent),
    currency: isSupportedCurrency(profileRow?.currency)
      ? profileRow.currency
      : undefined,
    role: normalizeSystemRole(storedRole),
    avatarUrl: profileRow?.avatar_url ?? (metadata.avatar_url as string | undefined),
    createdAt: profileRow?.created_at ?? user.created_at,
  }
}

export function getOnboardingStep(
  user: User | null | undefined,
  profileRow?: ProfileRow | null,
): 'profile' | null {
  if (!user || isProfileComplete(user, profileRow)) return null
  return 'profile'
}

export function getAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return translate('auth.somethingWrong')
  const message = 'message' in error && typeof error.message === 'string' ? error.message : ''
  if (message.includes('Invalid login credentials')) return translate('auth.invalidCredentials')
  if (message.includes('User already registered')) return translate('auth.emailAlreadyRegistered')
  if (message.includes('Email not confirmed')) return translate('auth.emailNotConfirmed')
  return message || translate('auth.somethingWrong')
}

export function getOnboardingPath(): '/auth/profile-setup' {
  return '/auth/profile-setup'
}

export function profileSetupToRow(userId: string, data: ProfileSetupData) {
  return {
    id: userId,
    full_name: data.fullName.trim(),
    avatar_url: data.avatarUrl ?? null,
    role: DEFAULT_PROFILE_ROLE,
    location: data.location.trim(),
  }
}

/** @deprecated Role selection removed — kept so stale sessionStorage keys are cleared. */
export function clearSelectedRole() {
  try {
    sessionStorage.removeItem('Genza_onboarding_role')
  } catch {
    // ignore
  }
}
