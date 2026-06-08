import type { ChatMessage, ChatSummary } from '../types/marketplace'
import type { ChatRow, MessageRow } from '../types/database'
import { getSupabaseErrorMessage, getSupabaseStepError } from './errors'
import { translate } from './i18n'
import { parseNumericChatId, parseNumericTaskId, sameUserId } from './ids'
import { notifyNewMessage } from './notifications'
import { fetchProfiles } from './profiles'
import { supabase } from './supabase'

const DEFAULT_TASK_TITLE = () => translate('chat.taskChat')

async function getAuthenticatedUserId(fallbackUserId: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? fallbackUserId
}

export function isChatParticipant(row: Pick<ChatRow, 'user_id' | 'tasker_id'>, userId: string) {
  return sameUserId(row.user_id, userId) || sameUserId(row.tasker_id, userId)
}

function getChatParticipantRole(row: Pick<ChatRow, 'user_id' | 'tasker_id'>, userId: string) {
  if (sameUserId(row.user_id, userId)) return 'owner' as const
  if (sameUserId(row.tasker_id, userId)) return 'tasker' as const
  return null
}

function logChatError(step: string, context: Record<string, unknown>, error: unknown) {
  console.error(`[Genza] ${step}`, {
    ...context,
    error: getSupabaseStepError(step, error),
  })
}

async function fetchTaskTitlesByIds(taskIds: Array<number | string | null | undefined>) {
  const uniqueIds = [
    ...new Set(
      taskIds
        .map((id) => (typeof id === 'number' ? id : parseNumericTaskId(String(id ?? ''))))
        .filter((id): id is number => id !== null),
    ),
  ]

  if (!uniqueIds.length) return new Map<number, string>()

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title')
    .in('id', uniqueIds)

  if (error) {
    logChatError('fetchTaskTitlesByIds', { taskIds: uniqueIds }, error)
    return new Map<number, string>()
  }

  return new Map(
    (data ?? []).map((row) => [Number(row.id), String(row.title ?? DEFAULT_TASK_TITLE())]),
  )
}

function resolveTaskTitle(
  taskId: number | string | null | undefined,
  titleMap: Map<number, string>,
): string {
  if (taskId == null) return DEFAULT_TASK_TITLE()

  const numericId = typeof taskId === 'number' ? taskId : parseNumericTaskId(String(taskId))
  if (numericId === null) return DEFAULT_TASK_TITLE()

  return titleMap.get(numericId) ?? DEFAULT_TASK_TITLE()
}

function mapChatRow(
  row: ChatRow,
  userId: string,
  taskTitle: string,
  other?: { full_name?: string | null; avatar_url?: string | null },
  lastMessage?: MessageRow,
): ChatSummary {
  const participant = isChatParticipant(row, userId)
  const otherId = sameUserId(row.user_id, userId) ? row.tasker_id : row.user_id

  return {
    id: String(row.id),
    taskId: row.task_id != null ? String(row.task_id) : '',
    taskTitle,
    ownerUserId: row.user_id,
    taskerUserId: row.tasker_id,
    otherUserId: otherId,
    otherUserName: other?.full_name?.trim() || translate('common.memberFallback'),
    otherUserAvatarUrl: other?.avatar_url ?? undefined,
    lastMessage: lastMessage?.message,
    lastMessageAt: lastMessage?.created_at,
    updatedAt: lastMessage?.created_at ?? row.created_at,
    canSendMessages: participant,
  }
}

export async function getChatIdForTask(taskIdRaw: string, userId: string) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) {
    return { chatId: undefined as string | undefined, error: translate('api.invalidTaskId') }
  }

  const authUserId = await getAuthenticatedUserId(userId)

  const { data, error } = await supabase
    .from('chats')
    .select('id, user_id, tasker_id')
    .eq('task_id', taskId)
    .maybeSingle()

  if (error) {
    logChatError('getChatIdForTask', { taskId, authUserId }, error)
    return { chatId: undefined, error: getSupabaseErrorMessage(error) }
  }

  if (!data) return { chatId: undefined, error: undefined }

  const row = data as ChatRow
  if (!isChatParticipant(row, authUserId)) {
    return { chatId: undefined, error: translate('api.chatNoAccess') }
  }

  return { chatId: String(row.id), error: undefined }
}

export async function ensureChatForTask(input: {
  taskId: string
  ownerId: string
  taskerId: string
  offerId?: string
  requesterId: string
}) {
  const existing = await getChatIdForTask(input.taskId, input.requesterId)
  if (existing.chatId || existing.error) return existing

  const taskId = parseNumericTaskId(input.taskId)
  if (taskId === null) {
    return { chatId: undefined, error: translate('api.invalidTaskId') }
  }

  if (input.requesterId !== input.ownerId) {
    return { chatId: undefined, error: undefined }
  }

  console.log('[Genza] ensureChatForTask (before insert)', {
    taskId,
    ownerId: input.ownerId,
    taskerId: input.taskerId,
  })

  const { data, error } = await supabase
    .from('chats')
    .insert({
      task_id: taskId,
      user_id: input.ownerId,
      tasker_id: input.taskerId,
      offer_id: input.offerId ?? null,
    })
    .select('id')
    .single()

  if (error) {
    logChatError('ensureChatForTask', { taskId, ownerId: input.ownerId }, error)
    return { chatId: undefined, error: getSupabaseStepError(translate('api.steps.createTaskChat'), error) }
  }

  console.log('[Genza] ensureChatForTask (after insert)', { chatId: data.id })

  return { chatId: String(data.id), error: undefined }
}

export async function listChatsForUser(userId: string) {
  const authUserId = await getAuthenticatedUserId(userId)

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .or(`user_id.eq.${authUserId},tasker_id.eq.${authUserId}`)
    .order('created_at', { ascending: false })

  if (error) {
    logChatError('listChatsForUser', { authUserId }, error)
    return { chats: [] as ChatSummary[], error: getSupabaseErrorMessage(error) }
  }

  const rows = (data ?? []) as ChatRow[]
  const titleMap = await fetchTaskTitlesByIds(rows.map((row) => row.task_id))
  const otherIds = rows.map((row) =>
    sameUserId(row.user_id, authUserId) ? row.tasker_id : row.user_id,
  )
  const { profiles } = await fetchProfiles(otherIds)
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const chatIds = rows.map((r) => parseNumericChatId(String(r.id))).filter((id): id is number => id !== null)
  const lastMessages = new Map<number, MessageRow>()

  if (chatIds.length) {
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: false })

    if (messagesError) {
      logChatError('listChatsForUser messages', { authUserId, chatCount: chatIds.length }, messagesError)
    }

    for (const message of (messages ?? []) as MessageRow[]) {
      const key = parseNumericChatId(String(message.chat_id))
      if (key !== null && !lastMessages.has(key)) {
        lastMessages.set(key, message)
      }
    }
  }

  const chats = rows.map((row) => {
    const otherId = sameUserId(row.user_id, authUserId) ? row.tasker_id : row.user_id
    const chatKey = parseNumericChatId(String(row.id))
    return mapChatRow(
      row,
      authUserId,
      resolveTaskTitle(row.task_id, titleMap),
      profileMap.get(otherId),
      chatKey !== null ? lastMessages.get(chatKey) : undefined,
    )
  })

  console.log('[Genza] listChatsForUser', { authUserId, chatCount: chats.length })

  return { chats, error: undefined }
}

export async function getChatById(chatIdRaw: string, userId: string) {
  const chatId = parseNumericChatId(chatIdRaw)
  if (chatId === null) {
    return { chat: null as ChatSummary | null, error: translate('api.invalidChatId') }
  }

  const authUserId = await getAuthenticatedUserId(userId)

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .maybeSingle()

  if (error || !data) {
    logChatError('getChatById', { chatId, authUserId }, error ?? 'Chat not found')
    return { chat: null, error: getSupabaseErrorMessage(error) || translate('api.chatNotFound') }
  }

  const row = data as ChatRow
  if (!isChatParticipant(row, authUserId)) {
    console.error('[Genza] getChatById access denied', {
      chatId,
      authUserId,
      ownerUserId: row.user_id,
      taskerUserId: row.tasker_id,
    })
    return { chat: null, error: translate('api.chatNoAccess') }
  }

  const titleMap = await fetchTaskTitlesByIds([row.task_id])
  const otherId = sameUserId(row.user_id, authUserId) ? row.tasker_id : row.user_id
  const { profiles } = await fetchProfiles([otherId])
  const other = profiles[0]

  return {
    chat: mapChatRow(row, authUserId, resolveTaskTitle(row.task_id, titleMap), other),
    error: undefined,
  }
}

export async function listMessages(chatIdRaw: string, userId: string) {
  const { chat, error: chatError } = await getChatById(chatIdRaw, userId)
  if (chatError || !chat) {
    return { messages: [] as ChatMessage[], chat: null, error: chatError || translate('api.chatNotFound') }
  }

  const chatId = parseNumericChatId(chatIdRaw)
  if (chatId === null) {
    return { messages: [] as ChatMessage[], chat: null, error: translate('api.invalidChatId') }
  }

  const authUserId = await getAuthenticatedUserId(userId)

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    logChatError('listMessages', { chatId, authUserId }, error)
    return { messages: [] as ChatMessage[], chat, error: getSupabaseErrorMessage(error) }
  }

  const rows = (data ?? []) as MessageRow[]
  const senderIds = [...new Set(rows.map((r) => r.sender_id))]
  const { profiles } = await fetchProfiles(senderIds)
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  console.log('[Genza] listMessages', { chatId, authUserId, messageCount: rows.length })

  return {
    messages: rows.map((row) => ({
      id: row.id,
      chatId: String(row.chat_id),
      senderId: row.sender_id,
      senderName: profileMap.get(row.sender_id)?.full_name?.trim() || translate('common.memberFallback'),
      message: row.message,
      createdAt: row.created_at,
      isMine: sameUserId(row.sender_id, authUserId),
    })),
    chat,
    error: undefined,
  }
}

export async function sendMessage(chatIdRaw: string, senderId: string, message: string) {
  const trimmed = message.trim()
  if (!trimmed) return { message: null as ChatMessage | null, error: translate('api.messageEmpty') }

  const chatId = parseNumericChatId(chatIdRaw)
  if (chatId === null) {
    return { message: null, error: translate('api.invalidChatId') }
  }

  const authUserId = await getAuthenticatedUserId(senderId)

  console.log('[Genza] sendMessage userId', {
    chatId,
    authUserId,
    requestedSenderId: senderId,
  })

  const { data: chatRow, error: chatRowError } = await supabase
    .from('chats')
    .select('id, user_id, tasker_id, task_id')
    .eq('id', chatId)
    .maybeSingle()

  if (chatRowError || !chatRow) {
    logChatError('sendMessage load chat', { chatId, authUserId }, chatRowError ?? 'Chat not found')
    return { message: null, error: getSupabaseErrorMessage(chatRowError) || translate('api.chatNotFound') }
  }

  const row = chatRow as ChatRow
  const participantRole = getChatParticipantRole(row, authUserId)
  const isParticipant = participantRole !== null

  console.log('[Genza] sendMessage participant check', {
    chatId,
    authUserId,
    ownerUserId: row.user_id,
    taskerUserId: row.tasker_id,
    isParticipant,
    participantRole,
  })

  if (!isParticipant) {
    return { message: null, error: translate('api.chatNoAccess') }
  }

  const titleMap = await fetchTaskTitlesByIds([row.task_id])
  const otherId = sameUserId(row.user_id, authUserId) ? row.tasker_id : row.user_id
  const { profiles: otherProfiles } = await fetchProfiles([otherId])
  const chat = mapChatRow(
    row,
    authUserId,
    resolveTaskTitle(row.task_id, titleMap),
    otherProfiles[0],
  )

  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: authUserId, message: trimmed })
    .select('*')
    .single()

  console.log('[Genza] sendMessage insert result', {
    chatId,
    authUserId,
    success: !error,
    messageId: data?.id ?? null,
    error: error ? getSupabaseErrorMessage(error) : null,
  })

  if (error) {
    logChatError('sendMessage', { chatId, senderId: authUserId }, error)
    return { message: null, error: getSupabaseStepError(translate('api.steps.sendMessage'), error) }
  }

  const messageRow = data as MessageRow
  const { profiles } = await fetchProfiles([authUserId])
  const senderName = profiles[0]?.full_name?.trim() || translate('api.senderYou')

  console.log('[GENZA EMAIL] chat send reached', {
    chatId,
    messageId: messageRow.id,
    senderId: authUserId,
  })

  const recipientUserId = sameUserId(row.user_id, authUserId) ? row.tasker_id : row.user_id

  console.log('[GENZA EMAIL] recipient resolved', {
    recipientUserId,
    senderId: authUserId,
    ownerUserId: row.user_id,
    taskerUserId: row.tasker_id,
    isSelf: sameUserId(recipientUserId, authUserId),
  })

  if (!sameUserId(recipientUserId, authUserId)) {
    const emailPayload = {
      userId: recipientUserId,
      notificationType: 'new_message' as const,
      type: 'new_message' as const,
      chatId,
      taskId: row.task_id ?? null,
      title: 'Nova poruka',
      body: 'Imate novu poruku na Genzi.',
    }

    console.log('[GENZA EMAIL] invoking send-notification-email', emailPayload)

    void (async () => {
      try {
        const result = await supabase.functions.invoke('send-notification-email', {
          body: emailPayload,
        })
        console.log('[GENZA EMAIL] invoke result', result)
      } catch (emailError) {
        console.log('[GENZA EMAIL] invoke result', {
          data: null,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        })
      }
    })()
  }

  void notifyNewMessage({
    receiverId: recipientUserId,
    senderId: authUserId,
    chatId,
    taskId: row.task_id ?? chat.taskId,
    preview: trimmed,
  }).then((notification) => {
    if (!notification.success && !notification.skipped) {
      console.error('[Genza] sendMessage notification failed', {
        chatId,
        recipientId: recipientUserId,
        error: notification.error,
      })
    }
  })

  return {
    message: {
      id: messageRow.id,
      chatId: String(chatId),
      senderId: authUserId,
      senderName,
      message: trimmed,
      createdAt: messageRow.created_at,
      isMine: true,
    } satisfies ChatMessage,
    error: undefined,
  }
}

export function subscribeToMessages(chatIdRaw: string, onMessage: (row: MessageRow) => void) {
  const chatId = parseNumericChatId(chatIdRaw)
  if (chatId === null) {
    console.error('[Genza] subscribeToMessages invalid chat id', { chatIdRaw })
    return supabase.channel(`messages:invalid:${chatIdRaw}`)
  }

  return supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload) => onMessage(payload.new as MessageRow),
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[Genza] messages realtime unavailable:', err?.message ?? status)
      }
    })
}

export async function markChatNotificationsRead(userId: string, chatIdRaw: string) {
  const authUserId = await getAuthenticatedUserId(userId)
  const chatId = parseNumericChatId(chatIdRaw)
  if (chatId === null) return { success: false, error: translate('api.invalidChatId') }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', authUserId)
    .eq('chat_id', chatId)
    .eq('type', 'new_message')
    .eq('read', false)

  if (error) {
    console.error('[Genza] markChatNotificationsRead failed', { chatId, authUserId, error: error.message })
    return { success: false, error: getSupabaseErrorMessage(error) }
  }

  return { success: true, error: undefined }
}
