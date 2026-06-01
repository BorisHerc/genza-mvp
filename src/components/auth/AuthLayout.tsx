import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../context/LocaleContext'
import { LegalOnboardingLinks } from '../legal/SiteFooter'
import { BrandMark } from '../ui/BrandMark'
import { cn } from '../../lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  backTo?: string
  showBack?: boolean
  step?: number
  totalSteps?: number
  footer?: React.ReactNode
}

export function AuthLayout({
  children,
  title,
  subtitle,
  backTo = '/auth/login',
  showBack = true,
  step,
  totalSteps,
  footer,
}: AuthLayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6 lg:max-w-md">
        <div className="mb-8">
          {showBack && (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-600"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </button>
          )}

          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="text-lg font-bold text-gray-900">{t('common.brand')}</span>
          </Link>

          {step && totalSteps && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
                <span>
                  {t('auth.stepOf', { current: step, total: totalSteps })}
                </span>
                <span>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex-1">{children}</div>

        {footer && (
          <div className={cn('mt-8 border-t border-gray-100 pt-6 text-center')}>
            {footer}
          </div>
        )}

        <div className="mt-6 pb-2">
          <LegalOnboardingLinks />
        </div>
      </div>
    </div>
  )
}
