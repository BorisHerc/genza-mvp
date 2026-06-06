import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppNotification, NotificationType } from '../types/marketplace'
import type { NotificationRow } from '../types/database'
import { getSupabaseErrorMessage, getSupabaseRawErrorMessage } from './errors'
import { translate } from './i18n'
import { isUuid, parseNumericChatId, parseNumericTaskId, sameUserId } from './ids'
import type { EmailNotificationKind } from './email/types'
import { trySendEmailNotification } from './email'
import { normalizeNotificationType } from './notification-display'
import { supabase } from './supabase'

export const NOTIFICATIONS_POLL_INTERVAL_MS = 30_000

/** Realtime is opt-in until the notifications table is added to supabase_realtime. */
const REALTIME_ENABLED = import.meta.env.VITE_ENABLE_NOTIFICATIONS_REALTIME === 'true'

const NOTIFICATION_TITLE_BY_TYPE: Record<NotificationType, string> = {
  new_offer: 'notifications.newOfferTitle',
  offer_accepted: 'notifications.offerAcceptedTitle',
  new_message: 'notifications.newMessageTitle',
  review_received: 'notifications.reviewReceivedTitle',
  nearby_task: 'notifications.nearbyTaskTitle',
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
    read: Boolean(row.read),
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

export async function listNotifications(userId: string) {
  const authUserId = await getAuthenticatedUserId(userId)

  console.log('[Genza] listNotifications (before fetch)', {
    requestedUserId: userId,
    authUserId,
  })

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(50)

  const mapped = mapNotificationRows((data ?? []) as NotificationRow[])

  console.log('[Genza] listNotifications (after fetch)', {
    authUserId,
    rawCount: data?.length ?? 0,
    mappedCount: mapped.length,
    types: mapped.map((item) => item.type),
    error: error?.message ?? null,
  })

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
    .update({ read: true })
    .eq('id', notificationId)

  if (error) return { success: false, error: getSupabaseErrorMessage(error) }
  return { success: true, error: undefined }
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return { success: false, error: getSupabaseErrorMessage(error) }
  return { success: true, error: undefined }
}

function logNotificationInsertFailure(
  label: string,
  payload: Record<string, unknown>,
  error: { message?: string; code?: string; details?: string; hint?: string },
) {
  console.error(`[Genza] ${label} (failed)`, {
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
  logContext?: string
}) {
  const numericTaskId = input.taskId ? parseNumericTaskId(input.taskId) : null
  const numericOfferId = input.offerId ? parseNumericTaskId(String(input.offerId)) : null
  const numericChatId = input.chatId ? parseNumericChatId(input.chatId) : null
  const payload = {
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    task_id: numericTaskId,
    offer_id: numericOfferId,
    chat_id: numericChatId,
    read: false,
  }

  if (input.logContext) {
    console.log(`[Genza] ${input.logContext} (before insert)`, payload)
  }

  // Do not chain .select() here — SELECT RLS only allows auth.uid() = user_id, so cross-user
  // notification inserts would roll back when the sender cannot read the receiver's row.
  const { error } = await supabase.from('notifications').insert(payload)

  if (error) {
    if (input.logContext) {
      logNotificationInsertFailure(input.logContext, payload, error)
    }
    return { success: false, error: getSupabaseErrorMessage(error), row: null }
  }

  if (input.logContext) {
    console.log(`[Genza] ${input.logContext} (after insert)`, { success: true })
  }

  const emailKind = notificationTypeToEmailKind(input.type)
  if (emailKind) {
    const actionUrl = buildNotificationActionUrl(input)
    void trySendEmailNotification({
      userId: input.userId,
      kind: emailKind,
      title: input.title,
      body: input.body,
      actionUrl,
    })
  }

  return { success: true, error: undefined, row: null }
}

function notificationTypeToEmailKind(type: NotificationType): EmailNotificationKind | null {
  if (type === 'new_offer' || type === 'offer_accepted' || type === 'new_message' || type === 'nearby_task') {
    return type
  }
  return null
}

function buildNotificationActionUrl(input: {
  taskId?: string
  chatId?: string
}): string | undefined {
  if (typeof window === 'undefined') return undefined
  const origin = window.location.origin
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
    console.log('[Genza] message notification skipped (sender is receiver)', {
      receiverId,
      senderId,
    })
    return { success: true, error: undefined, skipped: true as const }
  }

  if (!isUuid(receiverId)) {
    const error = translate('api.invalidReceiverId')
    console.error('[Genza] message notification insert result', { success: false, error })
    return { success: false, error, skipped: false as const }
  }

  const numericChatId = parseNumericChatId(String(input.chatId))
  if (numericChatId === null) {
    const error = translate('api.invalidChatId')
    console.error('[Genza] message notification insert result', { success: false, error })
    return { success: false, error, skipped: false as const }
  }

  const numericTaskId =
    input.taskId != null && String(input.taskId).trim() !== ''
      ? parseNumericTaskId(String(input.taskId))
      : null

  const payload = {
    user_id: receiverId,
    type: 'new_message' as const,
    title: translate('notifications.newMessageTitle'),
    body: truncatePreview(input.preview),
    task_id: numericTaskId,
    chat_id: numericChatId,
    read: false,
  }

  console.log('[Genza] message notification payload', payload)

  const { error } = await supabase.from('notifications').insert(payload)

  console.log('[Genza] message notification insert result', {
    success: !error,
    receiverId,
    chatId: numericChatId,
    error: error ? getSupabaseErrorMessage(error) : null,
  })

  if (error) {
    logNotificationInsertFailure('message notification', payload, error)
    return { success: false, error: getSupabaseErrorMessage(error), skipped: false as const }
  }

  void trySendEmailNotification({
    userId: receiverId,
    kind: 'new_message',
    title: payload.title,
    body: payload.body,
    actionUrl:
      typeof window !== 'undefined'
        ? `${window.location.origin}/messages/${numericChatId}`
        : undefined,
  })

  return { success: true, error: undefined, skipped: false as const }
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
  taskId: string
  rating: number
  comment?: string
}) {
  const revieweeId = input.revieweeId.trim()

  if (!isUuid(revieweeId)) {
    const error = translate('api.invalidReviewUserId')
    console.error('[Genza] review_received notification (before insert)', {
      error,
      revieweeId: input.revieweeId,
      taskId: input.taskId,
    })
    return { success: false, error, row: null }
  }

  const taskId = parseNumericTaskId(input.taskId)
  if (taskId === null) {
    const error = translate('api.invalidTaskIdForReview')
    console.error('[Genza] review_received notification (before insert)', {
      error,
      revieweeId,
      taskId: input.taskId,
    })
    return { success: false, error, row: null }
  }

  return createNotification({
    userId: revieweeId,
    type: 'review_received',
    title: translate('notifications.reviewReceivedTitle'),
    body: buildReviewNotificationBody(input.rating, input.comment),
    taskId: String(taskId),
    logContext: 'review_received notification',
  })
}

/**
 * Attempts a Realtime subscription. Returns null on failure so callers can poll instead.
 * Disabled by default — set VITE_ENABLE_NOTIFICATIONS_REALTIME=true after enabling Realtime
 * for public.notifications in Supabase.
 */
export function trySubscribeToNotifications(
  userId: string,
  onInsert: () => void,
): RealtimeChannel | null {
  if (!REALTIME_ENABLED) return null

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
        () => onInsert(),
      )
      .subscribe((status, err) => {
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
