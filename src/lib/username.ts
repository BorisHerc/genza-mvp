import { translate } from './i18n'

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

const RESERVED_USERNAMES = new Set([
  'admin',
  'genza',
  'support',
  'help',
  'login',
  'signup',
  'profile',
  'tasker',
  'client',
  'messages',
  'notifications',
  'post',
  'browse',
  'auth',
  'api',
  'www',
])

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function validateUsername(value: string): string | undefined {
  const username = normalizeUsername(value)

  if (!username) return translate('username.required')
  if (username.length < 3) return translate('username.minLength')
  if (username.length > 30) return translate('username.maxLength')
  if (!USERNAME_RE.test(username)) {
    return translate('username.invalidChars')
  }
  if (RESERVED_USERNAMES.has(username)) return translate('username.reserved')

  return undefined
}

export function slugifyUsernameFromName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)

  if (slug.length >= 3 && USERNAME_RE.test(slug) && !RESERVED_USERNAMES.has(slug)) {
    return slug
  }

  return ''
}

export function suggestUsername(fullName: string, userId: string): string {
  const fromName = slugifyUsernameFromName(fullName)
  if (fromName) return fromName

  return `user_${userId.replace(/-/g, '').slice(0, 8)}`
}
