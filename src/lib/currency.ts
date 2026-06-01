import { translate } from './i18n'

/** Supported marketplace currencies — extend CURRENCY_META when adding more. */
export type SupportedCurrency = 'BAM' | 'EUR'

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['BAM', 'EUR']

export const DEFAULT_CURRENCY: SupportedCurrency = 'BAM'

const CURRENCY_STORAGE_KEY = 'genza_currency'

export interface CurrencyMeta {
  code: SupportedCurrency
  symbol: string
  labelKey: string
}

export const CURRENCY_META: Record<SupportedCurrency, CurrencyMeta> = {
  BAM: {
    code: 'BAM',
    symbol: 'KM',
    labelKey: 'currency.bam',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    labelKey: 'currency.eur',
  },
}

const BOSNIA_HINTS = [
  'bih',
  'bosnia',
  'herzegovina',
  'bosna',
  'hercegovina',
  'mostar',
  'sarajevo',
  'banja luka',
  'tuzla',
  'zenica',
  'bijeljina',
  'brčko',
  'brcko',
  'trebinje',
]

const EU_COUNTRY_HINTS = [
  'austria', 'österreich', 'belgium', 'belgique', 'bulgaria', 'croatia', 'hrvatska',
  'cyprus', 'czech', 'česk', 'cesk', 'denmark', 'danmark', 'estonia', 'finland',
  'suomi', 'france', 'francuska', 'germany', 'njemačka', 'njemacka', 'deutschland',
  'greece', 'grčka', 'grcka', 'hungary', 'madžarska', 'madjarska', 'ireland',
  'italy', 'italija', 'latvia', 'lithuania', 'luxembourg', 'malta', 'netherlands',
  'nederland', 'poland', 'poljska', 'portugal', 'romania', 'rumunjska', 'slovakia',
  'slovenia', 'slovenija', 'spain', 'španjolska', 'spanjolska', 'sweden', 'svedska',
  'european union', 'eu',
  'zagreb', 'split', 'rijeka', 'ljubljana', 'maribor', 'wien', 'vienna', 'berlin',
  'munich', 'paris', 'madrid', 'rome', 'roma', 'amsterdam', 'brussels', 'prague',
  'praha', 'budapest', 'warsaw', 'warszawa', 'athens', 'dublin', 'helsinki',
  'stockholm', 'copenhagen', 'københavn', 'kobenhavn', 'lisbon', 'lisboa', 'bucharest',
  'sofia', 'bratislava', 'tallinn', 'riga', 'vilnius', 'valletta', 'nicosia',
]

let activeCurrency: SupportedCurrency = DEFAULT_CURRENCY

function normalizeLocation(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)
}

export function getDefaultCurrencyForLocation(location?: string | null): SupportedCurrency {
  if (!location?.trim()) return DEFAULT_CURRENCY

  const normalized = normalizeLocation(location)

  if (BOSNIA_HINTS.some((hint) => normalized.includes(hint))) {
    return 'BAM'
  }

  if (EU_COUNTRY_HINTS.some((hint) => normalized.includes(hint))) {
    return 'EUR'
  }

  return DEFAULT_CURRENCY
}

export function resolveTaskCurrency(
  currency: string | null | undefined,
  location?: string | null,
): SupportedCurrency {
  if (isSupportedCurrency(currency)) return currency
  return getDefaultCurrencyForLocation(location)
}

export function getCurrencySymbol(currency: SupportedCurrency = getActiveCurrency()) {
  return CURRENCY_META[currency].symbol
}

export function getCurrencyLabel(currency: SupportedCurrency) {
  return translate(CURRENCY_META[currency].labelKey)
}

export function formatAmountValue(amount: number) {
  if (!Number.isFinite(amount)) return '0'
  const rounded = Math.round(amount * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '')
}

export interface FormatCurrencyOptions {
  hourly?: boolean
  currency?: SupportedCurrency
}

/** Formats as "50 KM" or "25 €" per Genza marketplace convention. */
export function formatCurrency(amount: number, options?: FormatCurrencyOptions) {
  const currency = options?.currency ?? getActiveCurrency()
  const value = formatAmountValue(amount)
  const formatted = `${value} ${CURRENCY_META[currency].symbol}`

  if (options?.hourly) {
    return `${formatted}${translate('time.hourlySuffix')}`
  }

  return formatted
}

export function formatBudget(
  amount: number,
  type: 'fixed' | 'hourly',
  currency?: SupportedCurrency,
) {
  return formatCurrency(amount, {
    currency: currency ?? getActiveCurrency(),
    hourly: type === 'hourly',
  })
}

export function setActiveCurrency(currency: SupportedCurrency) {
  activeCurrency = currency
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
  } catch {
    // ignore storage errors
  }
}

export function getActiveCurrency(): SupportedCurrency {
  return activeCurrency
}

export function loadStoredCurrency(): SupportedCurrency {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY)
    if (isSupportedCurrency(stored)) return stored
  } catch {
    // ignore
  }
  return DEFAULT_CURRENCY
}

setActiveCurrency(loadStoredCurrency())
