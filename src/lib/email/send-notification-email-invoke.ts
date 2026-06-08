import { ensureAuthSession } from '../auth-session'
import { parseNumericChatId, parseNumericTaskId, sameUserId } from '../ids'
import { supabase } from '../supabase'

async function invokeSendNotificationEmail(body: Record<string, unknown>): Promise<void> {
  const session = await ensureAuthSession()
  if (!session?.access_token) {
    console.log('[GENZA EMAIL] invoke error', { message: 'No valid auth session' })
    return
  }

  console.log('[GENZA EMAIL] invoking function', body)

  try {
    const result = await supabase.functions.invoke('send-notification-email', { body })

    if (result.error) {
      console.log('[GENZA EMAIL] invoke error', result.error)
      return
    }

    console.log('[GENZA EMAIL] invoke success', result.data)
  } catch (error) {
    console.log('[GENZA EMAIL] invoke error', {
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function sendChatMessageEmailNotification(input: {
  recipientUserId: string
  senderUserId: string
  chatId: string
  taskId?: string | null
}) {
  console.log('[GENZA EMAIL] message flow reached', {
    chatId: input.chatId,
    senderUserId: input.senderUserId,
  })

  console.log('[GENZA EMAIL] recipientUserId', input.recipientUserId)

  if (sameUserId(input.recipientUserId, input.senderUserId)) {
    console.log('[GENZA EMAIL] invoke error', { message: 'recipientUserId is sender' })
    return
  }

  const numericChatId = parseNumericChatId(input.chatId)
  const numericTaskId =
    input.taskId != null && String(input.taskId).trim() !== ''
      ? parseNumericTaskId(String(input.taskId))
      : null

  await invokeSendNotificationEmail({
    userId: input.recipientUserId,
    notificationType: 'new_message',
    type: 'new_message',
    chatId: numericChatId,
    taskId: numericTaskId,
    title: 'Nova poruka',
    body: 'Imate novu poruku na Genzi.',
  })
}

export async function sendNewOfferEmailNotification(input: {
  recipientUserId: string
  senderUserId: string
  taskId: string
  offerId: string
}) {
  console.log('[GENZA EMAIL] message flow reached', {
    flow: 'new_offer',
    taskId: input.taskId,
    senderUserId: input.senderUserId,
  })

  console.log('[GENZA EMAIL] recipientUserId', input.recipientUserId)

  if (sameUserId(input.recipientUserId, input.senderUserId)) {
    console.log('[GENZA EMAIL] invoke error', { message: 'recipientUserId is sender' })
    return
  }

  await invokeSendNotificationEmail({
    userId: input.recipientUserId,
    notificationType: 'new_offer',
    type: 'new_offer',
    taskId: parseNumericTaskId(input.taskId),
    offerId: parseNumericTaskId(input.offerId),
    title: 'Nova ponuda',
    body: 'Imate novu ponudu na Genzi.',
  })
}
