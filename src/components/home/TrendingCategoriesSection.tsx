import { TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { TaskCategory } from '../../types'
import { getMockCategories } from '../../data/mockCategories'
import { rankTrendingCategories } from '../../lib/activity-labels'
import { useTranslation } from '../../context/LocaleContext'
import { CategoryPill } from '../tasks/CategoryPill'

interface TrendingCategoriesSectionProps {
  tasks: Array<{ category: TaskCategory }>
  activeCategory: TaskCategory | 'all'
  onCategoryChange: (category: TaskCategory | 'all') => void
}

export function TrendingCategoriesSection({
  tasks,
  activeCategory,
  onCategoryChange,
}: TrendingCategoriesSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mockCategories = getMockCategories()
  const icons = Object.fromEntries(mockCategories.map((c) => [c.id, c.icon]))
  const labels = Object.fromEntries(mockCategories.map((c) => [c.id, c.label]))
  const trending = rankTrendingCategories(tasks, icons, labels)

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          <h2 className="text-base font-bold text-gray-900">{t('trust.trendingCategories')}</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/browse')}
          className="text-xs font-semibold text-brand-600"
        >
          {t('trust.seeAll')}
        </button>
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <CategoryPill icon="🏠" label={t('categories.all')} active={activeCategory === 'all'} onClick={() => onCategoryChange('all')} />
        {trending.map((item) => (
          <CategoryPill
            key={item.category}
            icon={item.icon}
            label={`${item.label} (${item.count})`}
            active={activeCategory === item.category}
            onClick={() => onCategoryChange(item.category)}
          />
        ))}
      </div>
    </section>
  )
}
