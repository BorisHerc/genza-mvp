import type { AppNotification, NotificationType } from '../types/marketplace'
import { translate } from './i18n'

const NOTIFICATION_TYPES: NotificationType[] = [
  'new_offer',
  'offer_accepted',
  'new_message',
  'review_received',
  'nearby_task',
  'task_completed',
  'review_needed',
]

const NOTIFICATION_TITLE_BY_TYPE: Record<NotificationType, string> = {
  new_offer: 'notifications.newOfferTitle',
  offer_accepted: 'notifications.offerAcceptedTitle',
  new_message: 'notifications.newMessageTitle',
  review_received: 'notifications.reviewReceivedTitle',
  nearby_task: 'notifications.nearbyTaskTitle',
  task_completed: 'notifications.taskCompletedTitle',
  review_needed: 'notifications.reviewNeededTitle',
}

export function normalizeNotificationType(value: unknown): NotificationType {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (NOTIFICATION_TYPES.includes(raw as NotificationType)) {
    return raw as NotificationType
  }

  return 'new_message'
}

export interface ReviewNotificationDisplay {
  rating: number | null
  commentPreview: string | null
}

const REVIEW_BODY_RE = /^you received (\d+) stars?(?::\s*(.+))?$/i
const REVIEW_FALLBACK_RATING_RE = /^you received a (\d+)-star review\.?$/i
const REVIEW_BODY_HR_RE = /^primili ste recenziju od (\d+) zvjezdica\.?$/i

const NEW_OFFER_BODY_RE = /^someone offered on "(.+)"\.$/i
const NEW_OFFER_BODY_HR_RE = /^netko je poslao ponudu za „(.+)“\.$/i
const OFFER_ACCEPTED_BODY_RE = /^your offer on "(.+)" was accepted\./i
const OFFER_ACCEPTED_BODY_HR_RE = /^vaša ponuda za „(.+)“ je prihvaćena\./i
const ASSIGNMENT_CANCELLED_BODY_RE = /^the client cancelled the assignment for "(.+)"\.$/i
const ASSIGNMENT_CANCELLED_BODY_HR_RE = /^naručitelj je otkazao dodjelu za „(.+)“\.$/i

export function parseReviewNotificationBody(body: string): ReviewNotificationDisplay {
  const trimmedBody = body.trim()
  const legacyMatch = trimmedBody.match(REVIEW_BODY_RE)
  if (legacyMatch) {
    const rating = Number(legacyMatch[1])
    const commentPreview = legacyMatch[2]?.trim() || null

    return {
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      commentPreview,
    }
  }

  const fallbackMatch = trimmedBody.match(REVIEW_FALLBACK_RATING_RE)
  if (fallbackMatch) {
    const rating = Number(fallbackMatch[1])
    return {
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      commentPreview: null,
    }
  }

  const hrMatch = trimmedBody.match(REVIEW_BODY_HR_RE)
  if (hrMatch) {
    const rating = Number(hrMatch[1])
    return {
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      commentPreview: null,
    }
  }

  return { rating: null, commentPreview: trimmedBody || null }
}

export function getNotificationTitle(notification: AppNotification): string {
  return translate(NOTIFICATION_TITLE_BY_TYPE[notification.type] ?? 'notifications.genericTitle')
}

const NEARBY_TASK_BODY_RE = /^new task nearby: "(.+)"\.$/i
const NEARBY_TASK_BODY_HR_RE = /^novi posao u blizini: „(.+)“\.$/i
const TASK_COMPLETED_BODY_RE = /^task completed: "(.+)"\.$/i
const TASK_COMPLETED_BODY_HR_RE = /^posao završen: „(.+)“\.$/i
const REVIEW_NEEDED_BODY_RE = /^leave a review for "(.+)"\.$/i
const REVIEW_NEEDED_BODY_HR_RE = /^ostavite recenziju za „(.+)“\.$/i

export function getNotificationBody(notification: AppNotification): string {
  const body = notification.body.trim()
  if (!body) {
    if (notification.type === 'new_offer') return translate('notifications.newOfferBody')
    if (notification.type === 'offer_accepted') return translate('notifications.offerAcceptedBody')
    return body
  }

  const newOfferMatch = body.match(NEW_OFFER_BODY_RE) ?? body.match(NEW_OFFER_BODY_HR_RE)
  if (newOfferMatch && notification.type === 'new_offer') {
    return translate('notifications.newOfferBodyWithTask', { task: newOfferMatch[1] })
  }

  const acceptedMatch = body.match(OFFER_ACCEPTED_BODY_RE) ?? body.match(OFFER_ACCEPTED_BODY_HR_RE)
  if (acceptedMatch && notification.type === 'offer_accepted') {
    return translate('notifications.offerAcceptedBodyWithTask', { task: acceptedMatch[1] })
  }

  const cancelledMatch =
    body.match(ASSIGNMENT_CANCELLED_BODY_RE) ?? body.match(ASSIGNMENT_CANCELLED_BODY_HR_RE)
  if (cancelledMatch && notification.type === 'offer_accepted') {
    return translate('notifications.assignmentCancelledBody', { task: cancelledMatch[1] })
  }

  const nearbyMatch = body.match(NEARBY_TASK_BODY_RE) ?? body.match(NEARBY_TASK_BODY_HR_RE)
  if (nearbyMatch && notification.type === 'nearby_task') {
    return translate('notifications.nearbyTaskBodyWithTask', { task: nearbyMatch[1] })
  }

  const completedMatch = body.match(TASK_COMPLETED_BODY_RE) ?? body.match(TASK_COMPLETED_BODY_HR_RE)
  if (completedMatch && notification.type === 'task_completed') {
    return translate('notifications.taskCompletedBodyWithTask', { task: completedMatch[1] })
  }

  const reviewNeededMatch = body.match(REVIEW_NEEDED_BODY_RE) ?? body.match(REVIEW_NEEDED_BODY_HR_RE)
  if (reviewNeededMatch && notification.type === 'review_needed') {
    return translate('notifications.reviewNeededBodyWithTask', { task: reviewNeededMatch[1] })
  }

  const reviewDisplay = parseReviewNotificationBody(body)
  if (notification.type === 'review_received' && reviewDisplay.rating != null && !reviewDisplay.commentPreview) {
    return translate('notifications.reviewReceivedStars', { rating: reviewDisplay.rating })
  }

  if (notification.type === 'review_received' && reviewDisplay.commentPreview) {
    return reviewDisplay.commentPreview
  }

  return body
}

export function getNotificationHref(notification: AppNotification): string {
  if (notification.link?.startsWith('/')) {
    return notification.link
  }

  if (notification.taskId) {
    return `/tasks/${notification.taskId}`
  }

  if (notification.chatId) {
    return `/messages/${notification.chatId}`
  }

  return '/notifications'
}

export function isReviewNotification(notification: AppNotification): boolean {
  return notification.type === 'review_received'
}
