import { getMockCategories } from '../../data/mockCategories'
import type { TaskCategory } from '../../types'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface CategorySelectGridProps {
  value: TaskCategory | null
  onChange: (category: TaskCategory) => void
  error?: string
}

export function CategorySelectGrid({ value, onChange, error }: CategorySelectGridProps) {
  const { t } = useTranslation()
  const categories = getMockCategories()

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-gray-700">{t('tasks.postSteps.category')}</p>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={cn(
              'rounded-2xl border p-3 text-left transition-all',
              value === category.id
                ? 'border-brand-600 bg-brand-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-brand-300',
            )}
          >
            <span className="text-xl">{category.icon}</span>
            <p className="mt-2 text-sm font-semibold text-gray-900">{category.label}</p>
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}
