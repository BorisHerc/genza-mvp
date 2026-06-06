import type { StartingPrices } from '../../types/auth'
import type { TaskCategory } from '../../types'
import { getCategoryLabel } from '../../lib/utils'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'
import { ServiceCategorySelect } from './ServiceCategorySelect'

interface ServiceOfferingFieldsProps {
  serviceCategories: TaskCategory[]
  startingPrices: StartingPrices
  availabilityEnabled: boolean
  onCategoriesChange: (categories: TaskCategory[]) => void
  onStartingPriceChange: (category: TaskCategory, value: string) => void
  onAvailabilityChange: (enabled: boolean) => void
  categoryError?: string
}

export function ServiceOfferingFields({
  serviceCategories,
  startingPrices,
  availabilityEnabled,
  onCategoriesChange,
  onStartingPriceChange,
  onAvailabilityChange,
  categoryError,
}: ServiceOfferingFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <ServiceCategorySelect
        value={serviceCategories}
        onChange={onCategoriesChange}
        error={categoryError}
      />

      {serviceCategories.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900">{t('profile.startingPrices')}</p>
          <p className="text-xs text-gray-500">{t('profile.startingPricesHint')}</p>
          {serviceCategories.map((category) => (
            <label key={category} className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                {getCategoryLabel(category)}
              </span>
              <input
                type="number"
                min="1"
                value={startingPrices[category] ?? ''}
                onChange={(event) => onStartingPriceChange(category, event.target.value)}
                placeholder={t('profile.startingPricePlaceholder')}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('profile.availability')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('profile.availabilityNotificationsHint')}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={availabilityEnabled}
          onClick={() => onAvailabilityChange(!availabilityEnabled)}
          className={cn(
            'relative h-7 w-12 rounded-full transition-colors',
            availabilityEnabled ? 'bg-brand-600' : 'bg-gray-300',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
              availabilityEnabled ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </div>
  )
}
