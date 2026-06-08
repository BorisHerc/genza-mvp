import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import type { EmailNotificationType } from './types.ts'

const MESSAGE_DEDUP_WINDOW_MS = 2 * 60 * 1000

export async function emailAlreadySent(
  admin: SupabaseClient,
  input: {
    userId: string
    type: EmailNotificationType
    taskId?: number | null
    offerId?: number | null
    chatId?: number | null
    body?: string
  },
): Promise<boolean> {
  let query = admin
    .from('notification_email_log')
    .select('id')
    .eq('user_id', input.userId)
    .eq('type', input.type)
    .limit(1)

  if (input.type === 'new_message' && input.chatId != null) {
    const cutoff = new Date(Date.now() - MESSAGE_DEDUP_WINDOW_MS).toISOString()
    query = query
      .eq('chat_id', input.chatId)
      .gte('created_at', cutoff)

    const preview = input.body?.trim()
    if (preview) {
      query = query.eq('body_preview', preview.slice(0, 200))
    }
  } else if (input.offerId != null) {
    query = query.eq('offer_id', input.offerId)
  } else if (input.taskId != null) {
    query = query.eq('task_id', input.taskId)
  }

  const { data, error } = await query

  if (error) {
    console.warn('[Genza] email dedup check failed', error.message)
    return false
  }

  return Boolean(data?.length)
}

export async function logEmailSent(
  admin: SupabaseClient,
  input: {
    userId: string
    type: EmailNotificationType
    recipientEmail: string
    taskId?: number | null
    offerId?: number | null
    chatId?: number | null
    body?: string
    resendId?: string
  },
): Promise<void> {
  const { error } = await admin.from('notification_email_log').insert({
    user_id: input.userId,
    type: input.type,
    task_id: input.taskId ?? null,
    offer_id: input.offerId ?? null,
    chat_id: input.chatId ?? null,
    body_preview: input.body?.trim().slice(0, 200) ?? null,
    recipient_email: input.recipientEmail,
    resend_id: input.resendId ?? null,
  })

  if (error) {
    console.warn('[Genza] email log insert failed', error.message)
  }
}
