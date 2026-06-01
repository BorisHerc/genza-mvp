import { BadgeCheck, MessageCircle, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Task } from '../../types'
import { useTranslation } from '../../context/LocaleContext'
import { formatRating } from '../../lib/profile-text'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface TaskAssignmentBannerProps {
  task: Task
  chatHref?: string
  showChatButton?: boolean
}

function getTaskerProfilePath(task: Task) {
  const tasker = task.assignedTasker
  if (!tasker) return undefined
  return tasker.username ? `/u/${tasker.username}` : `/tasker/${task.assignedTaskerId ?? tasker.id}`
}

export function TaskAssignmentBanner({ task, chatHref, showChatButton }: TaskAssignmentBannerProps) {
  const { t } = useTranslation()
  const tasker = task.assignedTasker
  if (!tasker) return null

  const profilePath = getTaskerProfilePath(task)

  return (
    <section
      aria-label={t('tasks.assignedTasker')}
      className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100/40 shadow-card"
    >
      <div className="px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {t('tasks.assignmentBannerTitle')}
        </p>
        <div className="mt-3 flex items-start gap-3">
          {profilePath ? (
            <Link to={profilePath}>
              <Avatar name={tasker.name} imageUrl={tasker.avatarUrl} size="md" />
            </Link>
          ) : (
            <Avatar name={tasker.name} imageUrl={tasker.avatarUrl} size="md" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {profilePath ? (
                <Link to={profilePath} className="truncate text-base font-bold text-gray-900 hover:text-brand-700">
                  {tasker.name}
                </Link>
              ) : (
                <p className="truncate text-base font-bold text-gray-900">{tasker.name}</p>
              )}
              {tasker.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t('tasks.verified')}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-800">{formatRating(tasker.rating)}</span>
                <span>({t('tasks.reviewsCount', { count: tasker.reviewCount })})</span>
              </span>
              {(tasker.completedJobsCount ?? 0) > 0 && (
                <span>{t('tasks.jobsCompleted', { count: tasker.completedJobsCount ?? 0 })}</span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {task.status === 'in_progress'
                ? t('tasks.workUnderway')
                : t('tasks.readyToCoordinate')}
            </p>
          </div>
        </div>

        {showChatButton && chatHref && (
          <div className="mt-4">
            <Link to={chatHref}>
              <Button fullWidth variant="secondary" size="sm">
                <MessageCircle className="h-4 w-4" />
                {t('tasks.messageTasker')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
