import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatComposer } from '../components/chat/ChatComposer'
import { ReportButton } from '../components/moderation/ReportButton'
import { ChatEmptyState } from '../components/chat/ChatEmptyState'
import { ChatHeader } from '../components/chat/ChatHeader'
import { MessageBubble } from '../components/chat/MessageBubble'
import { ErrorState } from '../components/ui/ErrorState'
import { PageLoader } from '../components/ui/PageLoader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useNotifications } from '../context/NotificationsContext'
import {
  listMessages,
  markChatNotificationsRead,
  sendMessage,
  subscribeToMessages,
} from '../lib/chats'
import { translate } from '../lib/i18n'
import { useTranslation } from '../context/LocaleContext'
import { removeNotificationChannel } from '../lib/notifications'
import { sameUserId } from '../lib/ids'
import { fetchProfiles } from '../lib/profiles'
import type { ChatMessage, ChatSummary } from '../types/marketplace'
import type { MessageRow } from '../types/database'

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()
  const toast = useToast()
  const { refreshNotifications } = useNotifications()
  const [chat, setChat] = useState<ChatSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (!chatId || !user) return
    setIsLoading(true)
    setError('')

    const result = await listMessages(chatId, user.id)

    console.log('[Genza] ChatPage load', {
      chatId,
      authUserId: user.id,
      canSendMessages: result.chat?.canSendMessages ?? false,
      ownerUserId: result.chat?.ownerUserId ?? null,
      taskerUserId: result.chat?.taskerUserId ?? null,
    })

    setMessages(result.messages)
    setChat(result.chat ?? null)
    setError(result.error ?? '')

    if (result.chat && user.id) {
      await markChatNotificationsRead(user.id, chatId)
      void refreshNotifications()
    }

    setIsLoading(false)
  }

  useEffect(() => {
    void load()
  }, [chatId, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!chatId || !user) return

    const channel = subscribeToMessages(chatId, async (row: MessageRow) => {
      if (sameUserId(row.sender_id, user.id)) return

      const { profiles } = await fetchProfiles([row.sender_id])
      setMessages((current) => {
        if (current.some((m) => m.id === row.id)) return current
        return [
          ...current,
          {
            id: row.id,
            chatId: String(row.chat_id),
            senderId: row.sender_id,
            senderName: profiles[0]?.full_name?.trim() || translate('common.memberFallback'),
            message: row.message,
            createdAt: row.created_at,
            isMine: false,
          },
        ]
      })
      void refreshNotifications()
    })

    return () => {
      void removeNotificationChannel(channel)
    }
  }, [chatId, user?.id, refreshNotifications])

  if (isLoading) {
    return <PageLoader label={t('chat.loading')} className="min-h-[60dvh]" />
  }

  if (error || !chat) {
    return (
      <ErrorState
        message={error || t('chat.notFound')}
        actionLabel={t('chat.backToMessages')}
        onAction={() => navigate('/messages')}
      />
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <ChatHeader chat={chat} onBack={() => navigate('/messages')} />

      <div className="border-b border-gray-100 bg-white px-4 pb-3">
        <ReportButton
          target={{
            reportedUserId: chat.otherUserId,
            taskId: chat.taskId,
            chatId: chat.id,
            label: t('chat.reportConversation'),
          }}
          variant="outline"
          className="w-full"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        disabled={!chat.canSendMessages}
        onSend={async (text) => {
          if (!user || !chatId) return t('chat.sendFailed')

          const result = await sendMessage(chatId, user.id, text)
          if (result.error) {
            toast.error(result.error)
            return result.error
          }

          if (result.message) {
            setMessages((current) => {
              if (current.some((item) => item.id === result.message!.id)) return current
              return [...current, result.message!]
            })
          }

          return undefined
        }}
      />
    </div>
  )
}
