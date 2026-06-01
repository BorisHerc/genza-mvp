import { Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPublicTaskPath } from '../../lib/task-slug'
import type { Review } from '../../types/marketplace'
import type { Task } from '../../types'
import { useTranslation } from '../../context/LocaleContext'
import { TaskCard } from './TaskCard'
import { EmptyState } from '../ui/EmptyState'
import { cn } from '../../lib/utils'

interface CompletedTasksSectionProps {
  title: string
  emptyTitle?: string
  emptyDescription?: string
  emptyMessage?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  tasks: Task[]
  reviewsByTaskId?: Map<string, Review>
  className?: string
}

export function CompletedTasksSection({
  title,
  emptyTitle,
  emptyDescription,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  tasks,
  reviewsByTaskId,
  className,
}: CompletedTasksSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className={cn('mb-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">{t('tasks.completedCount', { count: tasks.length })}</span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Star className="h-6 w-6" />}
          title={emptyTitle ?? t('common.nothingYet')}
          description={emptyDescription ?? emptyMessage ?? t('tasks.completedWillShow')}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {tasks.map((task) => {
            const review = reviewsByTaskId?.get(task.id)

            return (
              <div key={task.id} className="space-y-2">
                <TaskCard
                  task={task}
                  reviewRating={review?.rating}
                  onClick={() => navigate(getPublicTaskPath(task.id, task.title, task.location))}
                />
                {review && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            'h-3.5 w-3.5',
                            index < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-amber-200',
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-medium">
                      {t('tasks.reviewReceived', { rating: review.rating })}
                    </span>
                    {review.comment && (
                      <span className="truncate text-amber-800/80">
                        &ldquo;{review.comment}&rdquo;
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
