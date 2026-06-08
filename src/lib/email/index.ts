import { parseNumericChatId, parseNumericTaskId } from '../ids'
import { supabase } from '../supabase'
import { EMAIL_NOTIFICATION_TYPES, type EmailNotificationKind } from './types'

export type { EmailNotificationKind } from './types'
export { EMAIL_NOTIFICATION_TYPES, isEmailNotificationType } from './types'

async function lookupProfileNotificationEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_email')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[GENZA] notification email lookup failed', {
      userId,
      message: error.message,
    })
    return null
  }

  const email = data?.notification_email?.trim()
  return email || null
}

/**
 * Invokes send-notification-email Edge Function after an in-app notification is created.
 * Never throws — failures are logged and ignored.
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
  if (!EMAIL_NOTIFICATION_TYPES.has(input.notificationType)) {
    return { sent: false, skipped: true as const, reason: 'type_not_enabled' }
  }

  const recipientEmail = await lookupProfileNotificationEmail(input.userId)

  const payload = {
    userId: input.userId,
    notificationType: input.notificationType,
    type: input.notificationType,
    title: input.title,
    body: input.body,
    taskId: input.taskId ? parseNumericTaskId(input.taskId) : null,
    offerId: input.offerId ? parseNumericTaskId(String(input.offerId)) : null,
    chatId: input.chatId ? parseNumericChatId(input.chatId) : null,
    recipientEmail,
    actionUrl: input.actionUrl,
  }

  console.log('[GENZA] send-notification-email invoke', {
    userId: input.userId,
    notificationType: input.notificationType,
    taskId: payload.taskId,
    offerId: payload.offerId,
    chatId: payload.chatId,
    recipientEmail: recipientEmail ?? null,
    hasActionUrl: Boolean(input.actionUrl),
  })

  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: payload,
    })

    if (error) {
      console.warn('[GENZA] send-notification-email invoke failed', {
        userId: input.userId,
        notificationType: input.notificationType,
        message: error.message,
      })
      return { sent: false, error: error.message }
    }

    const result = data as {
      sent?: boolean
      skipped?: boolean
      reason?: string
      resendId?: string
      error?: string
    } | null

    if (result?.skipped) {
      console.log('[GENZA] send-notification-email skipped', {
        userId: input.userId,
        notificationType: input.notificationType,
        reason: result.reason ?? 'unknown',
      })
      return { sent: false, skipped: true as const, reason: result.reason }
    }

    if (!result?.sent) {
      console.warn('[GENZA] send-notification-email delivery failed', {
        userId: input.userId,
        notificationType: input.notificationType,
        error: result?.error ?? 'unknown',
      })
      return { sent: false, error: result?.error }
    }

    console.log('[GENZA] send-notification-email delivered', {
      userId: input.userId,
      notificationType: input.notificationType,
      resendId: result.resendId ?? null,
    })

    return { sent: true, resendId: result.resendId }
  } catch (error) {
    console.warn('[GENZA] send-notification-email invoke failed', {
      userId: input.userId,
      notificationType: input.notificationType,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Email invoke failed',
    }
  }
}

/** @deprecated Use invokeSendNotificationEmail */
export const trySendEmailNotification = invokeSendNotificationEmail
