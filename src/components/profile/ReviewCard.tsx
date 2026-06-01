import type { ReviewWithDetails } from '../../types/profile'
import { getCategoryLabel, formatRelativeTime } from '../../lib/utils'
import { useTranslation } from '../../context/LocaleContext'
import { Card } from '../ui/Card'
import { StarRating } from './StarRating'

interface ReviewCardProps {
  review: ReviewWithDetails
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{review.reviewerName}</p>
          <p className="truncate text-xs text-brand-600">{review.taskTitle}</p>
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {formatRelativeTime(review.createdAt)}
        </span>
      </div>

      <StarRating rating={review.rating} />

      {review.comment ? (
        <p className="text-sm leading-relaxed text-gray-600">&ldquo;{review.comment}&rdquo;</p>
      ) : (
        <p className="text-sm text-gray-400">{t('reviews.noWrittenReview')}</p>
      )}

      {review.taskCategory && (
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {getCategoryLabel(review.taskCategory)}
        </p>
      )}
    </Card>
  )
}
