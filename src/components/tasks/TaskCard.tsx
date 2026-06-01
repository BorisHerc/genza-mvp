import {
  BadgeCheck,
  Clock,
  MapPin,
  MessageSquare,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import type { Task } from '../../types'
import { getCategoryIcon } from '../../lib/category-icons'
import {
  getFreshnessLabel,
  getLocalPopularityLabel,
  getTaskInterestLabel,
} from '../../lib/activity-labels'
import type { TaskProximity } from '../../lib/distance'
import { getTaskProximity } from '../../lib/distance'
import {
  formatBudget,
  getCategoryLabel,
} from '../../lib/utils'
import { formatOffersCount } from '../../lib/i18n'
import { useTranslation } from '../../context/LocaleContext'
import { useProximityOptions } from '../../hooks/useProximityOptions'
import { TaskDistanceBadge } from '../location/TaskDistanceBadge'
import { TaskStatusBadge } from './TaskStatusBadge'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface TaskCardProps {
  task: Task
  reviewRating?: number
  proximity?: TaskProximity
  onClick?: () => void
}

export function TaskCard({ task, reviewRating, proximity: proximityProp, onClick }: TaskCardProps) {
  const { t } = useTranslation()
  const proximityOptions = useProximityOptions()
  const proximity = proximityProp ?? getTaskProximity(task.location, proximityOptions)
  const categoryIcon = getCategoryIcon(task.category)
  const interestLabel = getTaskInterestLabel(task.offerCount)
  const popularityLabel = getLocalPopularityLabel(task.location, task.offerCount)
  const freshnessLabel = getFreshnessLabel(task.postedAt)

  return (
    <Card hover padding="none" onClick={onClick} className="overflow-hidden active:scale-[0.99]">
      <div className="flex flex-col">
        <div className="relative bg-gradient-to-br from-brand-50 via-white to-brand-100/50 px-5 pb-4 pt-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="brand" className="gap-1">
                <span aria-hidden>{categoryIcon}</span>
                {getCategoryLabel(task.category)}
              </Badge>
              {task.urgent && (
                <Badge variant="urgent" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {t('tasks.urgent')}
                </Badge>
              )}
              <TaskStatusBadge status={task.rawStatus ?? task.status} />
              {reviewRating != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {reviewRating}/5
                </span>
              )}
            </div>
            <span className="shrink-0 text-xl font-bold text-brand-700">
              {formatBudget(task.budget, task.budgetType, task.currency)}
            </span>
          </div>

          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-gray-900">
            {task.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {task.description}
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="inline-flex min-h-8 flex-wrap items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
              <span>{task.location}</span>
              {(proximity.source !== 'none' || proximity.isNearby || proximity.label) && (
                <>
                  <span className="text-gray-300" aria-hidden="true">
                    ·
                  </span>
                  <TaskDistanceBadge proximity={proximity} />
                </>
              )}
            </span>
            {task.scheduledFor && (
              <span className="inline-flex min-h-8 items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0 text-brand-500" />
                {task.scheduledFor}
              </span>
            )}
          </div>

          {(interestLabel || popularityLabel || freshnessLabel) && (
            <div className="flex flex-wrap gap-2">
              {freshnessLabel && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {freshnessLabel}
                </span>
              )}
              {interestLabel && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {interestLabel}
                </span>
              )}
              {popularityLabel && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  {popularityLabel}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={task.poster.name} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {task.poster.name}
                  </span>
                  {task.poster.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-gray-700">{task.poster.rating}</span>
                  <span>({task.poster.reviewCount})</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-gray-500">
              <span className="inline-flex min-h-7 items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {formatOffersCount(task.offerCount)}
              </span>
              <span className="inline-flex min-h-7 items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {t('common.chatReady')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
