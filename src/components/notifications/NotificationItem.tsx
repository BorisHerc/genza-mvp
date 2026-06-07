import { Bell, CheckCheck, CheckCircle2, ClipboardPen, MapPin, MessageCircle, Star, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AppNotification } from '../../types/marketplace'
import {
  getNotificationBody,
  getNotificationHref,
  getNotificationTitle,
  isReviewNotification,
  parseReviewNotificationBody,
} from '../../lib/notification-display'
import { formatNotificationTime } from '../../lib/notification-time'
import { cn } from '../../lib/utils'
import { Card } from '../ui/Card'

function getNotificationIcon(type: AppNotification['type']) {
  switch (type) {
    case 'new_offer':
      return Tag
    case 'offer_accepted':
      return CheckCheck
    case 'new_message':
      return MessageCircle
    case 'review_received':
      return Star
    case 'nearby_task':
      return MapPin
    case 'task_completed':
      return CheckCircle2
    case 'review_needed':
      return ClipboardPen
    default:
      return Bell
  }
}

interface NotificationItemProps {
  notification: AppNotification
  onMarkRead?: (id: string) => void
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const isReview = isReviewNotification(notification)
  const Icon = getNotificationIcon(notification.type)
  const href = getNotificationHref(notification)
  const title = getNotificationTitle(notification)
  const body = getNotificationBody(notification)
  const reviewDisplay = isReview ? parseReviewNotificationBody(notification.body) : null

  return (
    <Link
      to={href}
      onClick={() => {
        if (!notification.read) onMarkRead?.(notification.id)
      }}
    >
      <Card
        className={cn(
          'transition-colors hover:bg-brand-50/40',
          !notification.read && 'border-brand-200 bg-brand-50/30',
        )}
      >
        <div className="flex gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isReview ? 'bg-amber-100 text-amber-600' : 'bg-brand-100 text-brand-700',
            )}
          >
            <Icon className={cn('h-4 w-4', isReview && 'fill-amber-400 text-amber-500')} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              {!notification.read && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
              )}
            </div>

            {isReview && reviewDisplay ? (
              <div className="mt-1 space-y-1.5">
                {reviewDisplay.rating != null && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          'h-3.5 w-3.5',
                          index < reviewDisplay.rating!
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300',
                        )}
                      />
                    ))}
                    <span className="ml-1 text-xs font-medium text-amber-700">
                      {reviewDisplay.rating}/5
                    </span>
                  </div>
                )}
                {reviewDisplay.commentPreview ? (
                  <p className="text-sm text-gray-600">&ldquo;{reviewDisplay.commentPreview}&rdquo;</p>
                ) : (
                  <p className="text-sm text-gray-600">{body}</p>
                )}
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-gray-600">{body}</p>
            )}

            <p className="mt-1 text-xs text-gray-400">
              {formatNotificationTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
