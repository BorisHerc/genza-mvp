import { parseNumericChatId, parseNumericTaskId } from '../ids'
import { supabase } from '../supabase'

export type DirectEmailNotificationType =
  | 'new_message'
  | 'new_offer'
  | 'offer_accepted'
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

/**
 * Fire-and-forget Edge Function invoke. Never throws — safe to call from message/offer flows.
 */
export function invokeNotificationEmail(input: InvokeNotificationEmailInput): void {
  const body = buildInvokeBody(input)

  console.log('[GENZA EMAIL] invoking send-notification-email', body)

  void (async () => {
    try {
      const result = await supabase.functions.invoke('send-notification-email', { body })
      console.log('[GENZA EMAIL] invoke result', result)
    } catch (error) {
      console.log('[GENZA EMAIL] invoke result', {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })()
}
