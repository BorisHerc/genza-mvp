import { getMockCategories } from '../../data/mockCategories'
import type { TaskCategory } from '../../types'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface ServiceCategorySelectProps {
  value: TaskCategory[]
  onChange: (categories: TaskCategory[]) => void
  error?: string
}

export function ServiceCategorySelect({ value, onChange, error }: ServiceCategorySelectProps) {
  const { t } = useTranslation()
  const categories = getMockCategories()

  const toggle = (category: TaskCategory) => {
    if (value.includes(category)) {
      onChange(value.filter((item) => item !== category))
      return
    }
    onChange([...value, category])
  }

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-gray-700">{t('profile.serviceCategories')}</p>
      <p className="mb-3 text-xs text-gray-500">{t('profile.serviceCategoriesHint')}</p>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => {
          const selected = value.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              aria-pressed={selected}
              className={cn(
                'rounded-2xl border p-3 text-left transition-all',
                selected
                  ? 'border-brand-600 bg-brand-50 shadow-sm ring-1 ring-brand-200'
                  : 'border-gray-200 bg-white hover:border-brand-300',
              )}
            >
              <span className="text-xl">{category.icon}</span>
              <p className="mt-2 text-sm font-semibold text-gray-900">{category.label}</p>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}
