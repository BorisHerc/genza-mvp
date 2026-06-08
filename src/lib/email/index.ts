import { supabase } from '../supabase'
import { invokeNotificationEmail as invokeNotificationEmailDirect } from './invoke-notification-email'
import type { EmailNotificationKind } from './types'

export type { EmailNotificationKind } from './types'
export { EMAIL_NOTIFICATION_TYPES, isEmailNotificationType } from './types'
export {
  invokeNotificationEmail,
  type DirectEmailNotificationType,
  type InvokeNotificationEmailInput,
} from './invoke-notification-email'

/** Types emailed from createNotification (action-specific types use direct invoke). */
const EMAIL_FROM_CREATE_NOTIFICATION = new Set<EmailNotificationKind>([
  'offer_accepted',
  'task_completed',
  'review_received',
])

async function lookupProfileNotificationEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_email')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[GENZA EMAIL] notification email lookup failed', {
      userId,
      message: error.message,
    })
    return null
  }

  return data?.notification_email?.trim() || null
}

/**
 * Invokes send-notification-email for types handled inside createNotification.
 * new_message and new_offer are invoked directly from chats.ts / offers.ts.
 */
export async function invokeSendNotificationEmail(input: {
  userId: string
  notificationType: EmailNotificationKind
  title: string
  body: string
  taskId?: string
  offerId?: string
  chatId?: string
  actionUrl?: string
}) {
  if (!EMAIL_FROM_CREATE_NOTIFICATION.has(input.notificationType)) {
    return { sent: false, skipped: true as const, reason: 'handled_at_action_site' }
  }

  const recipientEmail = await lookupProfileNotificationEmail(input.userId)

  invokeNotificationEmailDirect({
    userId: input.userId,
    notificationType: input.notificationType,
    title: input.title,
    body: input.body,
    taskId: input.taskId,
    offerId: input.offerId,
    chatId: input.chatId,
    recipientEmail,
    actionUrl: input.actionUrl,
  })

  return { sent: false, invoked: true as const }
}

/** @deprecated Use invokeNotificationEmail */
export const trySendEmailNotification = invokeSendNotificationEmail
