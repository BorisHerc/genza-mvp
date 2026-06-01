import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from '../../context/LocaleContext'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher'
import { getLegalPath, TRUST_SAFETY_PATH } from '../../content/legal'
import { cn } from '../../lib/utils'

const LEGAL_FOOTER_LINKS = [
  { to: getLegalPath('terms'), labelKey: 'legal.nav.terms' },
  { to: getLegalPath('privacy'), labelKey: 'legal.nav.privacy' },
  { to: getLegalPath('disclaimer'), labelKey: 'legal.nav.disclaimer' },
  { to: getLegalPath('community'), labelKey: 'legal.nav.community' },
] as const

const TRUST_FOOTER_LINKS = [
  { to: getLegalPath('safety'), labelKey: 'legal.nav.safety' },
  { to: getLegalPath('cookies'), labelKey: 'legal.nav.cookies' },
  { to: TRUST_SAFETY_PATH, labelKey: 'legal.trustSafety' },
] as const

const footerNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-[44px] w-full items-center rounded-xl px-3 py-2.5 text-sm text-gray-600 transition-colors',
    'hover:bg-gray-100 hover:text-brand-600 active:bg-gray-200 active:scale-[0.99]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    isActive && 'bg-brand-50 font-medium text-brand-700',
  )

interface SiteFooterProps {
  compact?: boolean
  className?: string
}

export function SiteFooter({ compact = false, className }: SiteFooterProps) {
  const { t } = useTranslation()

  return (
    <footer
      className={cn(
        'relative z-10 mx-auto max-w-3xl px-4 py-8 lg:max-w-2xl',
        !compact && 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]',
        className,
      )}
    >
      <div className={cn('grid gap-8', compact ? 'sm:grid-cols-2' : 'md:grid-cols-3')}>
        <div className="sm:col-span-2 md:col-span-1">
          <p className="text-base font-bold text-gray-900">{t('common.brand')}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('legal.footerTagline')}</p>
          <NavLink
            to={TRUST_SAFETY_PATH}
            className={({ isActive }) =>
              cn(
                'mt-3 inline-flex min-h-[44px] items-center rounded-xl px-1 text-sm font-semibold transition-colors',
                'hover:text-brand-700 active:scale-[0.99]',
                isActive ? 'text-brand-700' : 'text-brand-600',
              )
            }
          >
            {t('legal.trustSafety')} →
          </NavLink>
        </div>

        <nav aria-label={t('legal.footerLegal')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('legal.footerLegal')}
          </p>
          <ul className="mt-2 space-y-0.5">
            {LEGAL_FOOTER_LINKS.map(({ to, labelKey }) => (
              <li key={to}>
                <NavLink to={to} className={footerNavLinkClass}>
                  {t(labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('legal.footerTrust')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('legal.footerTrust')}
          </p>
          <ul className="mt-2 space-y-0.5">
            {TRUST_FOOTER_LINKS.map(({ to, labelKey }) => (
              <li key={to}>
                <NavLink to={to} className={footerNavLinkClass}>
                  {t(labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 border-t border-gray-100 pt-6">
        <LanguageSwitcher variant="compact" />
        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {t('common.brand')}. {t('legal.footerRights')}
        </p>
      </div>
    </footer>
  )
}

export function LegalOnboardingLinks() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3 text-center">
      <p className="text-xs text-gray-500">{t('legal.onboardingHint')}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
        <Link to={getLegalPath('terms')} className="font-medium text-brand-600 hover:underline">
          {t('legal.nav.terms')}
        </Link>
        <span className="text-gray-300" aria-hidden="true">
          ·
        </span>
        <Link to={getLegalPath('privacy')} className="font-medium text-brand-600 hover:underline">
          {t('legal.nav.privacy')}
        </Link>
        <span className="text-gray-300" aria-hidden="true">
          ·
        </span>
        <Link to={TRUST_SAFETY_PATH} className="font-medium text-brand-600 hover:underline">
          {t('legal.trustSafety')}
        </Link>
      </div>
    </div>
  )
}
