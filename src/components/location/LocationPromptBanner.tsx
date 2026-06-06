import { AlertCircle, MapPin, X } from 'lucide-react'
import { useGeolocation } from '../../context/GeolocationContext'
import { useTranslation } from '../../context/LocaleContext'
import { Button } from '../ui/Button'

interface LocationPromptBannerProps {
  className?: string
}

export function LocationPromptBanner({ className }: LocationPromptBannerProps) {
  const { t } = useTranslation()
  const { showPrompt, status, requestLocation, dismissPrompt } = useGeolocation()

  if (status === 'denied') {
    return (
      <div
        className={`mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 ${className ?? ''}`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{t('geolocation.deniedTitle')}</p>
            <p className="mt-1 text-xs leading-relaxed">{t('geolocation.deniedHint')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unsupported') {
    return (
      <div className={`mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 ${className ?? ''}`}>
        <p>{t('geolocation.unsupported')}</p>
      </div>
    )
  }

  if (!showPrompt) return null

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm ${className ?? ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <MapPin className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{t('geolocation.promptTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{t('geolocation.promptHint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={requestLocation} disabled={status === 'loading'}>
              {status === 'loading' ? t('geolocation.loading') : t('geolocation.enable')}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissPrompt}>
              {t('geolocation.notNow')}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissPrompt}
          className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={t('common.dismiss')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
