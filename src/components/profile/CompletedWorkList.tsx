import type { CompletedWorkItem } from '../../types/profile'
import { getCategoryLabel, formatRelativeTime } from '../../lib/utils'
import { useTranslation } from '../../context/LocaleContext'
import { Card } from '../ui/Card'
import { StarRating } from './StarRating'

interface CompletedWorkListProps {
  items: CompletedWorkItem[]
  emptyMessage?: string
}

export function CompletedWorkList({ items, emptyMessage }: CompletedWorkListProps) {
  const { t } = useTranslation()

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-gray-500">{emptyMessage ?? t('tasks.noCompletedWork')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900">{item.title}</h3>
              {item.category && (
                <p className="text-xs text-gray-500">{getCategoryLabel(item.category)}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-gray-400">
              {formatRelativeTime(item.completedAt)}
            </span>
          </div>

          {item.review ? (
            <div className="rounded-xl bg-amber-50 px-3 py-2">
              <StarRating rating={item.review.rating} />
              {item.review.comment && (
                <p className="mt-2 text-sm text-amber-900/80">&ldquo;{item.review.comment}&rdquo;</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400">{t('profile.completedNoReview')}</p>
          )}
        </Card>
      ))}
    </div>
  )
}
