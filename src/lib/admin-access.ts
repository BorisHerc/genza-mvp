import type { ProfileRow } from '../types/database'
import { isAdminRole } from './roles'

export function isAdminProfile(profile: ProfileRow | null | undefined): boolean {
  return isAdminRole(profile?.role)
}

export function isUserSuspended(profile: ProfileRow | null | undefined): boolean {
  return Boolean(profile?.suspended_at)
}

export function checkAdminAccess(profile: ProfileRow | null | undefined, userId?: string | null) {
  const isAdmin = isAdminProfile(profile)

  if (import.meta.env.DEV) {
    console.debug('[Genza] admin access check', {
      userId: userId ?? profile?.id ?? null,
      role: profile?.role ?? null,
      isAdmin,
    })
  }

  return isAdmin
}
