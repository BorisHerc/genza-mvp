import { MapPin } from 'lucide-react'
import { LocationPromptBanner } from '../location/LocationPromptBanner'
import { useGeolocation } from '../../context/GeolocationContext'
import { useTranslation } from '../../context/LocaleContext'
import { MOCK_CITIES } from '../../data/mockAuth'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface LocationSetupPanelProps {
  location: string
  neighborhood: string
  onLocationChange: (value: string) => void
  onNeighborhoodChange: (value: string) => void
  locationError?: string
}

export function LocationSetupPanel({
  location,
  neighborhood,
  onLocationChange,
  onNeighborhoodChange,
  locationError,
}: LocationSetupPanelProps) {
  const { t } = useTranslation()
  const { coords, status, requestLocation } = useGeolocation()

  return (
    <div className="space-y-5">
      <LocationPromptBanner />

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
        <div>
          <Input
            label={t('auth.city')}
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            leftIcon={<MapPin className="h-4 w-4" />}
            list="post-city-suggestions"
          />
          <datalist id="post-city-suggestions">
            {MOCK_CITIES.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          {locationError && <p className="mt-1 text-xs font-medium text-red-500">{locationError}</p>}
        </div>

        <Input
          label={t('profile.neighborhood')}
          value={neighborhood}
          onChange={(e) => onNeighborhoodChange(e.target.value)}
          hint={t('profile.neighborhoodHint')}
          leftIcon={<MapPin className="h-4 w-4" />}
        />

        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
          <p className="text-xs font-medium text-gray-700">
            {coords
              ? t('geolocation.coordsSaved')
              : status === 'loading'
                ? t('geolocation.loading')
                : t('geolocation.manualFallbackHint')}
          </p>
          {!coords && status !== 'loading' && (
            <Button type="button" size="sm" className="mt-2" onClick={requestLocation}>
              {t('geolocation.enable')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
