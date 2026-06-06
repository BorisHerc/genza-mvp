import { MapPin } from 'lucide-react'
import type { StartingPrices } from '../../types/auth'
import type { TaskCategory } from '../../types'
import { LocationPromptBanner } from '../location/LocationPromptBanner'
import { useGeolocation } from '../../context/GeolocationContext'
import { useTranslation } from '../../context/LocaleContext'
import { MOCK_CITIES } from '../../data/mockAuth'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ServiceOfferingFields } from './ServiceOfferingFields'

interface ServiceSetupPanelProps {
  location: string
  neighborhood: string
  notificationEmail: string
  serviceCategories: TaskCategory[]
  startingPrices: StartingPrices
  availabilityEnabled: boolean
  onLocationChange: (value: string) => void
  onNeighborhoodChange: (value: string) => void
  onNotificationEmailChange: (value: string) => void
  onCategoriesChange: (categories: TaskCategory[]) => void
  onStartingPriceChange: (category: TaskCategory, value: string) => void
  onAvailabilityChange: (enabled: boolean) => void
  categoryError?: string
  locationError?: string
}

export function ServiceSetupPanel({
  location,
  neighborhood,
  notificationEmail,
  serviceCategories,
  startingPrices,
  availabilityEnabled,
  onLocationChange,
  onNeighborhoodChange,
  onNotificationEmailChange,
  onCategoriesChange,
  onStartingPriceChange,
  onAvailabilityChange,
  categoryError,
  locationError,
}: ServiceSetupPanelProps) {
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
            list="service-city-suggestions"
          />
          <datalist id="service-city-suggestions">
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

        <Input
          label={t('onboarding.notificationEmail')}
          type="email"
          value={notificationEmail}
          onChange={(e) => onNotificationEmailChange(e.target.value)}
          hint={t('onboarding.notificationEmailHint')}
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

      <ServiceOfferingFields
        serviceCategories={serviceCategories}
        startingPrices={startingPrices}
        availabilityEnabled={availabilityEnabled}
        onCategoriesChange={onCategoriesChange}
        onStartingPriceChange={onStartingPriceChange}
        onAvailabilityChange={onAvailabilityChange}
        categoryError={categoryError}
      />
    </div>
  )
}
