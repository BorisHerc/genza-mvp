/** App-level roles — marketplace users vs admin. */
export type SystemRole = 'user' | 'admin'

/** Legacy values still stored in `profiles.role` for demo/backward compatibility. */
export type LegacyProfileRole = 'client' | 'tasker' | 'user' | 'admin'

export const DEFAULT_PROFILE_ROLE: LegacyProfileRole = 'user'

export function normalizeSystemRole(role: string | null | undefined): SystemRole {
  if (role === 'admin') return 'admin'
  return 'user'
}

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeSystemRole(role) === 'admin'
}

export function isLegacyMarketplaceRole(role: string | null | undefined): boolean {
  return role === 'client' || role === 'tasker' || role === 'user' || role == null
}

export function isValidStoredProfileRole(role: string | null | undefined): boolean {
  return (
    role === 'user' ||
    role === 'client' ||
    role === 'tasker' ||
    role === 'admin'
  )
}
