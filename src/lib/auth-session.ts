import { supabase } from './supabase'

const REFRESH_TOKEN_ERROR_MARKERS = [
  'Refresh Token Not Found',
  'Invalid Refresh Token',
  'refresh_token_not_found',
]

export function isRefreshTokenError(message: string | undefined): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return REFRESH_TOKEN_ERROR_MARKERS.some(
    (marker) => lower.includes(marker.toLowerCase()),
  )
}

/** Clears broken Supabase auth state from localStorage. */
export async function clearStaleAuthSession(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch (error) {
    console.warn('[Genza] clearStaleAuthSession signOut failed', error)
  }

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.includes('auth-token')) {
      localStorage.removeItem(key)
    }
  }
}

/**
 * Returns a usable session for Edge Function invokes.
 * Clears stale refresh tokens instead of leaving the client in a broken state.
 */
export async function ensureAuthSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    if (isRefreshTokenError(error.message)) {
      console.warn('[Genza] Invalid refresh token — clearing session', error.message)
      await clearStaleAuthSession()
      return null
    }
    console.warn('[Genza] getSession error', error.message)
    return null
  }

  if (data.session?.access_token) {
    return data.session
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()

  if (refreshError) {
    if (isRefreshTokenError(refreshError.message)) {
      console.warn('[Genza] refreshSession failed — clearing session', refreshError.message)
      await clearStaleAuthSession()
    }
    return null
  }

  return refreshed.session
}
