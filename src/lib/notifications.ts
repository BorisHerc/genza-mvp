import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppNotification, NotificationType } from '../types/marketplace'
import type { NotificationRow } from '../types/database'
import { getSupabaseErrorMessage, getSupabaseRawErrorMessage } from './errors'
import { translate } from './i18n'
import { isUuid, parseNumericChatId, parseNumericTaskId, sameUserId } from './ids'
import { invokeSendNotificationEmail, isEmailNotificationType } from './email'
import { normalizeNotificationType } from './notification-display'
import { preparePushDelivery } from './push/delivery'
import { supabase } from './supabase'

export const NOTIFICATIONS_POLL_INTERVAL_MS = 30_000

const NOTIFICATION_TITLE_BY_TYPE: Record<NotificationType, string> = {
  new_offer: 'notifications.newOfferTitle',
  offer_accepted: 'notifications.offerAcceptedTitle',
  new_message: 'notifications.newMessageTitle',
  review_received: 'notifications.reviewReceivedTitle',
  nearby_task: 'notifications.nearbyTaskTitle',
  task_completed: 'notifications.taskCompletedTitle',
  review_needed: 'notifications.reviewNeededTitle',
}

function mapNotification(row: NotificationRow): AppNotification {
  const type = normalizeNotificationType(row.type)

  return {
    id: row.id,
    type,
    title: row.title?.trim() || translate(NOTIFICATION_TITLE_BY_TYPE[type] ?? 'notifications.genericTitle'),
    body: row.body?.trim() || '',
    taskId: row.task_id != null ? String(row.task_id) : undefined,
    offerId: row.offer_id != null ? String(row.offer_id) : undefined,
    chatId: row.chat_id != null ? String(row.chat_id) : undefined,
    link: row.link?.trim() || undefined,
    read: Boolean(row.read) || Boolean(row.read_at),
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  }
}

function mapNotificationRows(rows: NotificationRow[]): AppNotification[] {
  return rows
    .map((row) => {
      try {
        return mapNotification(row)
      } catch (error) {
        console.warn('[Genza] Skipped invalid notification row:', row, error)
        return null
      }
    })
    .filter((item): item is AppNotification => item !== null)
}

async function getAuthenticatedUserId(fallbackUserId: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? fallbackUserId
}

export function buildNotificationLink(input: {
  taskId?: string
  offerId?: string
  chatId?: string
}): string {
  if (input.chatId) return `/messages/${input.chatId}`
  if (input.taskId) return `/tasks/${input.taskId}`
  return '/notifications'
}

async function notificationAlreadyExists(input: {
  userId: string
  type: NotificationType
  taskId?: number | null
  offerId?: number | null
  chatId?: number | null
  body?: string
}): Promise<boolean> {
  let query = supabase
    .from('notifications')
    .select('id')
    .eq('user_id', input.userId)
    .eq('type', input.type)
    .limit(1)

  if (input.taskId != null) query = query.eq('task_id', input.taskId)
  if (input.offerId != null) query = query.eq('offer_id', input.offerId)

  if (input.type === 'new_message' && input.chatId != null) {
    query = query.eq('chat_id', input.chatId)
    if (input.body?.trim()) {
      query = query.eq('body', input.body.trim())
    }
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    query = query.gte('created_at', cutoff)
  } else if (input.chatId != null) {
    query = query.eq('chat_id', input.chatId)
  }

  const { data, error } = await query

  if (error) {
    console.warn('[Genza] notification dedup check failed:', error.message)
    return false
  }

  return Boolean(data?.length)
}

export async function listNotifications(userId: string) {
  const authUserId = await getAuthenticatedUserId(userId)

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(50)

  const mapped = mapNotificationRows((data ?? []) as NotificationRow[])

  if (error) return { notifications: [] as AppNotification[], error: getSupabaseErrorMessage(error) }
  return {
    notifications: mapped,
    error: undefined,
  }
}

export async function getUnreadNotificationCount(userId: string) {
  const authUserId = await getAuthenticatedUserId(userId)

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', authUserId)
    .eq('read', false)

  if (error) return { count: 0, error: getSupabaseErrorMessage(error) }
  return { count: count ?? 0, error: undefined }
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) return { success: false, error: getSupabaseErrorMessage(error) }
  return { success: true, error: undefined }
}

export async function markAllNotificationsRead(userId: string) {
  const readAt = new Date().toISOString()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: readAt })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return { success: false, error: getSupabaseErrorMessage(error) }
  return { success: true, error: undefined }
}

function logNotificationInsertFailure(
  payload: Record<string, unknown>,
  error: { message?: string; code?: string; details?: string; hint?: string },
) {
  console.warn('[Genza] notification insert failed', {
    payload,
    message: error.message ?? getSupabaseRawErrorMessage(error),
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  })
}

export async function createNotification(input: {
  userId: string
  type: NotificationType
  title: string
  body: string
  taskId?: string
  offerId?: string
  chatId?: string
  actorUserId?: string
  logContext?: string
}) {
  const recipientId = input.userId.trim()

  if (input.actorUserId && sameUserId(recipientId, input.actorUserId)) {
    console.log('[Genza] notification skipped own action', {
      type: input.type,
      userId: recipientId,
    })
    return { success: true, error: undefined, row: null, skipped: true as const }
  }

  const numericTaskId = input.taskId ? parseNumericTaskId(input.taskId) : null
  const numericOfferId = input.offerId ? parseNumericTaskId(String(input.offerId)) : null
  const numericChatId = input.chatId ? parseNumericChatId(input.chatId) : null
  const link = buildNotificationLink({
    taskId: input.taskId,
    chatId: input.chatId,
  })

  const isDuplicate = await notificationAlreadyExists({
    userId: recipientId,
    type: input.type,
    taskId: numericTaskId,
    offerId: numericOfferId,
    chatId: numericChatId,
    body: input.body,
  })

  if (isDuplicate) {
    console.log('[Genza] notification skipped duplicate', {
      type: input.type,
      userId: recipientId,
      taskId: numericTaskId,
      offerId: numericOfferId,
      chatId: numericChatId,
    })
    return { success: true, error: undefined, row: null, skipped: true as const }
  }

  const payload = {
    user_id: recipientId,
    type: input.type,
    title: input.title,
    body: input.body,
    task_id: numericTaskId,
    offer_id: numericOfferId,
    chat_id: numericChatId,
    link,
    read: false,
  }

  const { error } = await supabase.from('notifications').insert(payload)

  if (error) {
    logNotificationInsertFailure(payload, error)
    return { success: false, error: getSupabaseErrorMessage(error), row: null, skipped: false as const }
  }

  console.log('[Genza] notification created', {
    type: input.type,
    userId: recipientId,
    taskId: numericTaskId,
    offerId: numericOfferId,
    chatId: numericChatId,
    context: input.logContext ?? null,
  })

  void preparePushDelivery({
    userId: recipientId,
    type: input.type,
    title: input.title,
    body: input.body,
    link,
  })

  if (isEmailNotificationType(input.type)) {
    void invokeSendNotificationEmail({
      userId: recipientId,
      notificationType: input.type,
      title: input.title,
      body: input.body,
      taskId: input.taskId,
      offerId: input.offerId,
      chatId: input.chatId,
      actionUrl: buildNotificationActionUrl({
        taskId: input.taskId,
        chatId: input.chatId,
        link,
      }),
    })
  }

  return { success: true, error: undefined, row: null, skipped: false as const }
}

function buildNotificationActionUrl(input: {
  taskId?: string
  chatId?: string
  link?: string
}): string | undefined {
  if (typeof window === 'undefined') return undefined
  const origin = window.location.origin
  if (input.link?.startsWith('/')) return `${origin}${input.link}`
  if (input.chatId) return `${origin}/messages/${input.chatId}`
  if (input.taskId) return `${origin}/tasks/${input.taskId}`
  return `${origin}/notifications`
}

function truncatePreview(text: string, maxLength = 80) {
  const trimmed = text.trim()
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed
}

export async function notifyNewMessage(input: {
  receiverId: string
  senderId: string
  chatId: string | number
  taskId?: string | number | null
  preview: string
}) {
  const receiverId = input.receiverId.trim()
  const senderId = input.senderId.trim()

  if (sameUserId(receiverId, senderId)) {
    console.log('[Genza] notification skipped own action', {
      type: 'new_message',
      userId: receiverId,
    })
    return { success: true, error: undefined, skipped: true as const }
  }

  if (!isUuid(receiverId)) {
    const error = translate('api.invalidReceiverId')
    console.warn('[Genza] notification insert failed', { type: 'new_message', error })
    return { success: false, error, skipped: false as const }
  }

  const numericChatId = parseNumericChatId(String(input.chatId))
  if (numericChatId === null) {
    const error = translate('api.invalidChatId')
    console.warn('[Genza] notification insert failed', { type: 'new_message', error })
    return { success: false, error, skipped: false as const }
  }

  const numericTaskId =
    input.taskId != null && String(input.taskId).trim() !== ''
      ? parseNumericTaskId(String(input.taskId))
      : null

  const body = truncatePreview(input.preview)

  return createNotification({
    userId: receiverId,
    type: 'new_message',
    title: translate('notifications.newMessageTitle'),
    body,
    taskId: numericTaskId != null ? String(numericTaskId) : undefined,
    chatId: String(numericChatId),
    actorUserId: senderId,
    logContext: 'new_message notification',
  })
}

export function buildReviewNotificationBody(rating: number, comment?: string): string {
  const trimmed = comment?.trim()
  if (trimmed) {
    return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed
  }

  return translate('notifications.reviewReceivedStars', { rating })
}

export async function notifyReviewReceived(input: {
  revieweeId: string
  reviewerId: string
  taskId: string
  rating: number
  comment?: string
}) {
  const revieweeId = input.revieweeId.trim()

  if (!isUuid(revieweeId)) {
    const error = translate('api.invalidReviewUserId')
    console.warn('[Genza] notification insert failed', { type: 'review_received', error })
    return { success: false, error, row: null }
  }

  const taskId = parseNumericTaskId(input.taskId)
  if (taskId === null) {
    const error = translate('api.invalidTaskIdForReview')
    console.warn('[Genza] notification insert failed', { type: 'review_received', error })
    return { success: false, error, row: null }
  }

  return createNotification({
    userId: revieweeId,
    type: 'review_received',
    title: translate('notifications.reviewReceivedTitle'),
    body: buildReviewNotificationBody(input.rating, input.comment),
    taskId: String(taskId),
    actorUserId: input.reviewerId,
    logContext: 'review_received notification',
  })
}

export async function notifyTaskMarkedComplete(input: {
  taskId: string
  taskTitle: string
  ownerUserId: string
  taskerUserId?: string | null
  completedByUserId: string
}) {
  const taskId = parseNumericTaskId(input.taskId)
  if (taskId === null) {
    console.warn('[Genza] notification insert failed', { type: 'task_completed', error: 'invalid task id' })
    return { success: false, error: translate('api.invalidTaskId') }
  }

  const results: Array<{ success: boolean }> = []

  if (input.taskerUserId && !sameUserId(input.taskerUserId, input.completedByUserId)) {
    const taskerResult = await createNotification({
      userId: input.taskerUserId,
      type: 'task_completed',
      title: translate('notifications.taskCompletedTitle'),
      body: translate('notifications.taskCompletedBodyWithTask', { task: input.taskTitle }),
      taskId: input.taskId,
      actorUserId: input.completedByUserId,
      logContext: 'task_completed notification',
    })
    results.push(taskerResult)
  }

  const reviewTargets = [input.ownerUserId, input.taskerUserId].filter(
    (id): id is string => Boolean(id?.trim()),
  )

  for (const userId of reviewTargets) {
    const reviewResult = await createNotification({
      userId,
      type: 'review_needed',
      title: translate('notifications.reviewNeededTitle'),
      body: translate('notifications.reviewNeededBodyWithTask', { task: input.taskTitle }),
      taskId: input.taskId,
      logContext: 'review_needed notification',
    })
    results.push(reviewResult)
  }

  return {
    success: results.every((result) => result.success),
    error: undefined,
  }
}

/**
 * Subscribes to Realtime inserts for the current user. Falls back to polling when unavailable.
 */
export function trySubscribeToNotifications(
  userId: string,
  onInsert: () => void,
): RealtimeChannel | null {
  try {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          console.log('[Genza] realtime notification received', { userId })
          onInsert()
        },
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Genza] notifications realtime subscribed', { userId })
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Genza] Notifications realtime unavailable:', err?.message ?? status)
        }
      })

    return channel
  } catch (error) {
    console.warn('[Genza] Notifications realtime disabled:', error)
    return null
  }
}

export async function removeNotificationChannel(channel: RealtimeChannel | null) {
  if (!channel) return

  try {
    await supabase.removeChannel(channel)
  } catch (error) {
    console.warn('[Genza] Failed to remove notifications channel:', error)
  }
}

/** @deprecated Use trySubscribeToNotifications — kept for compatibility. */
export function subscribeToNotifications(userId: string, onInsert: () => void) {
  return trySubscribeToNotifications(userId, onInsert)
}
