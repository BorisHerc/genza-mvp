import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Star } from 'lucide-react'
import { LeaveReviewForm } from '../reviews/LeaveReviewForm'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useTranslation } from '../../context/LocaleContext'
import { getReviewForTask, submitReview } from '../../lib/reviews'
import type { Review } from '../../types/marketplace'
import type { Task } from '../../types'
import type { AuthProfile } from '../../types/auth'

interface TaskCompletedPanelProps {
  task: Task
  user: AuthProfile | null
}

export function TaskCompletedPanel({ task, user }: TaskCompletedPanelProps) {
  const { t } = useTranslation()
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [isLoadingReview, setIsLoadingReview] = useState(true)

  const isParticipant = Boolean(task.isOwner || task.isAssignedTasker)

  const reviewee = useMemo(() => {
    if (task.isOwner) {
      const taskerId = task.assignedTaskerId ?? task.assignedTasker?.id
      if (!taskerId) return null

      return {
        id: taskerId,
        name: task.assignedTasker?.name ?? t('tasks.assignedTasker'),
        avatarUrl: task.assignedTasker?.avatarUrl,
        roleLabel: t('profile.roleTasker'),
      }
    }

    if (task.isAssignedTasker && task.userId) {
      return {
        id: task.userId,
        name: task.poster.name,
        avatarUrl: task.poster.avatarUrl,
        roleLabel: t('profile.badgeClient'),
      }
    }

    return null
  }, [task, t])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    console.debug('[Genza] TaskCompletedPanel mounted', {
      taskId: task.id,
      status: task.status,
      rawStatus: task.rawStatus ?? null,
      isParticipant,
      isOwner: task.isOwner,
      isAssignedTasker: task.isAssignedTasker,
      revieweeId: reviewee?.id ?? null,
    })
  }, [task, isParticipant, reviewee?.id])

  useEffect(() => {
    if (!isParticipant || !user) {
      setIsLoadingReview(false)
      return
    }

    let cancelled = false

    async function loadReview() {
      const reviewerId = user!.id
      setIsLoadingReview(true)
      const result = await getReviewForTask(task.id, reviewerId)
      if (cancelled) return
      setMyReview(result.review)
      setReviewSubmitted(Boolean(result.review))
      setReviewError(result.error ?? '')
      setIsLoadingReview(false)
    }

    void loadReview()
    return () => {
      cancelled = true
    }
  }, [isParticipant, task.id, user?.id])

  const handleSubmitReview = async (input: { rating: number; comment: string }) => {
    if (!reviewee || !user) return t('reviews.signInRequired')

    setReviewError('')
    const result = await submitReview({
      taskId: task.id,
      reviewerId: user.id,
      revieweeId: reviewee.id,
      rating: input.rating,
      comment: input.comment,
    })

    if (result.error || !result.review) {
      return result.error ?? t('reviews.submitFailed')
    }

    if (result.notificationError) {
      console.error('[Genza] Review saved but notification failed:', result.notificationError)
    }

    setMyReview(result.review)
    setReviewSubmitted(true)
    setShowReviewForm(false)
    return undefined
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-emerald-200 p-0">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 px-4 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">{t('tasks.taskCompletedTitle')}</p>
              <p className="mt-1 text-sm text-emerald-800">{t('tasks.taskCompletedHint')}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-base font-bold text-gray-900">{t('tasks.peopleOnTask')}</h2>

        <div className="flex items-center gap-3">
          <Avatar name={task.poster.name} imageUrl={task.poster.avatarUrl} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{task.poster.name}</p>
            <p className="text-xs text-gray-500">{t('tasks.clientPosted')}</p>
          </div>
        </div>

        {task.assignedTasker ? (
          <div className="flex items-center gap-3">
            <Avatar name={task.assignedTasker.name} imageUrl={task.assignedTasker.avatarUrl} />
            <div>
              <p className="text-sm font-semibold text-gray-900">{task.assignedTasker.name}</p>
              <p className="text-xs text-gray-500">{t('tasks.taskerCompleted')}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('tasks.noAssignedTasker')}</p>
        )}
      </Card>

      {isParticipant && reviewee && user && (
        <Card className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">{t('reviews.leaveReview')}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('tasks.leaveReviewAbout', { name: reviewee.name })}
            </p>
          </div>

          {isLoadingReview ? (
            <p className="text-sm text-gray-500">{t('tasks.loadingReview')}</p>
          ) : reviewSubmitted && myReview ? (
            <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <p className="text-sm font-medium text-brand-800">{t('tasks.reviewSubmittedLabel')}</p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < myReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {myReview.comment && (
                <p className="text-sm text-gray-700">{myReview.comment}</p>
              )}
            </div>
          ) : showReviewForm ? (
            <LeaveReviewForm revieweeName={reviewee.name} onSubmit={handleSubmitReview} />
          ) : (
            <Button fullWidth onClick={() => setShowReviewForm(true)}>
              {t('reviews.leaveReview')}
            </Button>
          )}

          {reviewError && !showReviewForm && (
            <p className="text-sm text-red-600">{reviewError}</p>
          )}
        </Card>
      )}

      {!isParticipant && (
        <Card className="text-sm text-gray-500">{t('tasks.onlyParticipantsReview')}</Card>
      )}
    </div>
  )
}
