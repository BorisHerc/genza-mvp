import { useState, type FormEvent } from 'react'
import { Star } from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface LeaveReviewFormProps {
  revieweeName: string
  onSubmit: (input: { rating: number; comment: string }) => Promise<string | undefined>
}

export function LeaveReviewForm({ revieweeName, onSubmit }: LeaveReviewFormProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (rating < 1) {
      setError(t('reviews.ratingRequired'))
      return
    }

    setIsSubmitting(true)
    const resultError = await onSubmit({ rating, comment: comment.trim() })
    setIsSubmitting(false)

    if (resultError) {
      setError(resultError)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">
          {t('reviews.rateExperience', { name: revieweeName })}
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={
                value === 1
                  ? t('reviews.starAria', { count: value })
                  : t('reviews.starsAria', { count: value })
              }
              onClick={() => setRating(value)}
              className="rounded-lg p-1 transition-colors hover:bg-brand-50"
            >
              <Star
                className={cn(
                  'h-7 w-7',
                  value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label={t('reviews.comment')}
        placeholder={t('reviews.shareExperience')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={isSubmitting}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? t('reviews.submitting') : t('reviews.submit')}
      </Button>
    </form>
  )
}
