import { en } from '../locales/en'
import { hr } from '../locales/hr'
import type { Locale, TranslationDictionary, TranslationParams } from '../locales/types'

export type { Locale, TranslationParams }

export const DEFAULT_LOCALE: Locale = 'hr'
export const SUPPORTED_LOCALES: Locale[] = ['hr', 'en']

const LOCALE_STORAGE_KEY = 'genza_locale'

const dictionaries: Record<Locale, TranslationDictionary> = { hr, en }

let activeLocale: Locale = DEFAULT_LOCALE

function getNestedValue(dict: TranslationDictionary, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = dict

  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value)),
    template,
  )
}

export function translate(key: string, params?: TranslationParams): string {
  const localized =
    getNestedValue(dictionaries[activeLocale], key) ??
    getNestedValue(dictionaries.en, key) ??
    key

  return interpolate(localized, params)
}

/** Shorthand alias used across the app. */
export const t = translate

export function setActiveLocale(locale: Locale) {
  activeLocale = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'hr' ? 'hr' : 'en'
  }
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore storage errors
  }
}

export function getActiveLocale(): Locale {
  return activeLocale
}

export function loadStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'hr' || stored === 'en') return stored
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE
}

export function getCategoryLabel(category: string): string {
  const key = `categories.${category}`
  const label = translate(key)
  return label === key
    ? category
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : label
}

export function getTaskStatusLabel(status: string): string {
  const key = `tasks.status.${status}`
  const label = translate(key)
  return label === key ? translate('common.unknown') : label
}

export function getReportReasons() {
  return [
    { value: 'harassment', label: translate('moderation.reasons.harassment') },
    { value: 'spam', label: translate('moderation.reasons.spam') },
    { value: 'fraud', label: translate('moderation.reasons.fraud') },
    { value: 'inappropriate', label: translate('moderation.reasons.inappropriate') },
    { value: 'safety', label: translate('moderation.reasons.safety') },
    { value: 'other', label: translate('moderation.reasons.other') },
  ] as const
}

export function getOfferStatusLabel(status: string): string {
  const key = `offers.status.${status}`
  const label = translate(key)
  return label === key ? translate('common.unknown') : label
}

export function pluralizeHr(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function formatOffersCount(count: number): string {
  if (getActiveLocale() === 'hr') {
    return pluralizeHr(
      count,
      translate('tasks.offersCount.one', { count }),
      translate('tasks.offersCount.few', { count }),
      translate('tasks.offersCount.many', { count }),
    )
  }
  return count === 1
    ? translate('tasks.offersCount.one', { count })
    : translate('tasks.offersCount.few', { count })
}

setActiveLocale(loadStoredLocale())
