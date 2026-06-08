import { Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Task } from '../../types'
import { buildTaskActivityFeed } from '../../lib/activity-labels'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LocaleContext'
import { canViewTaskOfferInsights } from '../../lib/offer-visibility'
import { getPublicTaskPath } from '../../lib/task-slug'
import { Card } from '../ui/Card'

interface LocalActivityFeedProps {
  tasks: Task[]
}

export function LocalActivityFeed({ tasks }: LocalActivityFeedProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const items = buildTaskActivityFeed(
    tasks.map((task) => ({
      id: task.id,
      title: task.title,
      offerCount: canViewTaskOfferInsights({ task, isAdmin: user?.role === 'admin' })
        ? task.offerCount
        : 0,
      postedAt: task.postedAt,
      location: task.location,
      category: task.category,
    })),
  )

  if (!items.length) return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-5 w-5 text-brand-600" />
        <h2 className="text-base font-bold text-gray-900">{t('trust.localActivity')}</h2>
      </div>
      <Card padding="none" className="divide-y divide-gray-100">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const task = tasks.find((entry) => entry.id === item.id)
              if (task) {
                navigate(getPublicTaskPath(task.id, task.title, task.location))
              }
            }}
            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-600">{item.label}</p>
              <p className="mt-0.5 line-clamp-1 text-sm font-medium text-gray-900">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-gray-400">{item.time}</span>
          </button>
        ))}
      </Card>
    </section>
  )
}
