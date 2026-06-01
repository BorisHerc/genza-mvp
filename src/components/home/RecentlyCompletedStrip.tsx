import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Task } from '../../types'
import { getCategoryIcon } from '../../lib/category-icons'
import { useTranslation } from '../../context/LocaleContext'
import { getPublicTaskPath } from '../../lib/task-slug'
import { formatBudget, formatRelativeTime, getCategoryLabel } from '../../lib/utils'
import { Card } from '../ui/Card'

interface RecentlyCompletedStripProps {
  tasks: Task[]
}

export function RecentlyCompletedStrip({ tasks }: RecentlyCompletedStripProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!tasks.length) return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-brand-600" />
        <h2 className="text-base font-bold text-gray-900">{t('trust.recentlyCompleted')}</h2>
      </div>
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {tasks.map((task) => (
          <Card
            key={task.id}
            hover
            className="w-56 shrink-0 snap-start p-4"
            onClick={() => navigate(getPublicTaskPath(task.id, task.title, task.location))}
          >
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-brand-700">
              <span aria-hidden>{getCategoryIcon(task.category)}</span>
              {getCategoryLabel(task.category)}
            </div>
            <p className="line-clamp-2 text-sm font-semibold text-gray-900">{task.title}</p>
            <p className="mt-2 text-xs text-gray-500">{task.location}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-bold text-brand-700">{formatBudget(task.budget, task.budgetType, task.currency)}</span>
              <span className="text-gray-400">{formatRelativeTime(task.postedAt)}</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
