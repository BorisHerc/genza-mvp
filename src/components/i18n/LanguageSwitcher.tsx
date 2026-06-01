import { SUPPORTED_LOCALES, type Locale } from '../../lib/i18n'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

const LOCALE_LABEL_KEYS: Record<Locale, 'language.hr' | 'language.en'> = {
  hr: 'language.hr',
  en: 'language.en',
}

const LOCALE_CODE_KEYS: Record<Locale, 'language.codeHr' | 'language.codeEn'> = {
  hr: 'language.codeHr',
  en: 'language.codeEn',
}

interface LanguageSwitcherProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function LanguageSwitcher({ variant = 'full', className }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation()

  if (variant === 'compact') {
    return (
      <div
        role="group"
        aria-label={t('language.title')}
        className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', className)}
      >
        {SUPPORTED_LOCALES.map((code, index) => (
          <span key={code} className="inline-flex items-center gap-1.5">
            {index > 0 && (
              <span className="font-normal text-gray-300" aria-hidden="true">
                |
              </span>
            )}
            <button
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={locale === code}
              aria-label={t(LOCALE_LABEL_KEYS[code])}
              className={cn(
                'min-h-[44px] min-w-[44px] rounded-lg px-2 transition-colors',
                'hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                locale === code ? 'text-brand-700' : 'text-gray-500',
              )}
            >
              {t(LOCALE_CODE_KEYS[code])}
            </button>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="mb-1.5 text-sm font-semibold text-gray-700">{t('language.title')}</p>
      <p className="mb-3 text-xs text-gray-500">{t('language.hint')}</p>
      <div
        role="group"
        aria-label={t('language.title')}
        className="grid grid-cols-2 gap-3"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={cn(
              'rounded-2xl border p-4 text-left transition-all',
              locale === code
                ? 'border-brand-600 bg-brand-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-brand-300',
            )}
          >
            <p className="text-sm font-semibold text-gray-900">{t(LOCALE_LABEL_KEYS[code])}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
