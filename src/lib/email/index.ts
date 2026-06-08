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
 * Invokes send-notification-email immediately after notification insert (async, non-blocking).
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
  createdAt?: string
}) {
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
    createdAt: input.createdAt,
  })

  return { sent: false, invoked: true as const }
}

/** @deprecated Use invokeNotificationEmail */
export const trySendEmailNotification = invokeSendNotificationEmail
