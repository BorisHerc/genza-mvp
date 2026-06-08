import { ensureAuthSession } from '../auth-session'
import { parseNumericChatId, parseNumericTaskId } from '../ids'
import { supabase } from '../supabase'

export type DirectEmailNotificationType =
  | 'new_message'
  | 'new_offer'
  | 'offer_accepted'
  | 'nearby_task'
  | 'task_completed'
  | 'review_received'

export interface InvokeNotificationEmailInput {
  userId: string
  notificationType: DirectEmailNotificationType
  title: string
  body: string
  taskId?: string | number | null
  offerId?: string | number | null
  chatId?: string | number | null
  recipientEmail?: string | null
  actionUrl?: string
  createdAt?: string
}

function buildInvokeBody(input: InvokeNotificationEmailInput) {
  return {
    userId: input.userId,
    notificationType: input.notificationType,
    type: input.notificationType,
    title: input.title,
    body: input.body,
    taskId:
      input.taskId != null && String(input.taskId).trim() !== ''
        ? parseNumericTaskId(String(input.taskId))
        : null,
    offerId:
      input.offerId != null && String(input.offerId).trim() !== ''
        ? parseNumericTaskId(String(input.offerId))
        : null,
    chatId:
      input.chatId != null && String(input.chatId).trim() !== ''
        ? parseNumericChatId(String(input.chatId))
        : null,
    recipientEmail: input.recipientEmail ?? null,
    actionUrl: input.actionUrl,
  }
}

function emailTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Fire-and-forget Edge Function invoke. Never throws — safe after notification insert.
 */
export function invokeNotificationEmail(input: InvokeNotificationEmailInput): void {
  const createdAt = input.createdAt ?? emailTimestamp()
  const body = buildInvokeBody(input)

  console.log('[GENZA EMAIL] created_at', { createdAt, type: input.notificationType, userId: input.userId })

  void (async () => {
    const invokedAt = emailTimestamp()
    console.log('[GENZA EMAIL] invoked_at', { invokedAt, type: input.notificationType, userId: input.userId })

    const session = await ensureAuthSession()
    if (!session?.access_token) {
      console.log('[GENZA EMAIL] invoke error', {
        message: 'No valid auth session',
        invokedAt,
      })
      return
    }

    try {
      const result = await supabase.functions.invoke('send-notification-email', { body })

      if (result.error) {
        console.log('[GENZA EMAIL] invoke error', { invokedAt, error: result.error })
        return
      }

      console.log('[GENZA EMAIL] delivered_at', {
        deliveredAt: emailTimestamp(),
        invokedAt,
        createdAt,
        type: input.notificationType,
        data: result.data,
      })
    } catch (error) {
      console.log('[GENZA EMAIL] invoke error', {
        invokedAt,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  })()
}
