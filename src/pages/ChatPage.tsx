import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useVisualViewportInset } from '../hooks/useVisualViewportInset'
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
  const [composerHeight, setComposerHeight] = useState(88)
  const keyboardInset = useVisualViewportInset()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(Boolean(chatId && !isLoading && chat))

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current
    if (!container) return

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      })
    })
  }, [])

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
    if (!isLoading && chat) {
      scrollToLatest('auto')
    }
  }, [isLoading, chat, scrollToLatest])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToLatest('smooth')
    }
  }, [messages, scrollToLatest])

  useEffect(() => {
    if (keyboardInset > 0) {
      scrollToLatest('auto')
    }
  }, [keyboardInset, scrollToLatest])

  useEffect(() => {
    const composerEl = composerRef.current
    if (!composerEl) return

    const updateHeight = () => {
      setComposerHeight(composerEl.offsetHeight)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(composerEl)

    return () => observer.disconnect()
  }, [chat, isLoading])

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

  const messagesPaddingBottom = composerHeight + keyboardInset + 8

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
      <div className="z-20 shrink-0 border-b border-gray-100 bg-white">
        <ChatHeader chat={chat} onBack={() => navigate('/messages')} />
        <div className="px-4 pb-3">
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
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-safe px-4 py-4"
        style={{ paddingBottom: messagesPaddingBottom }}
      >
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
      </div>

      <div
        ref={composerRef}
        className="chat-composer fixed inset-x-0 z-30 mx-auto w-full max-w-lg lg:max-w-2xl"
        style={{ bottom: keyboardInset }}
      >
        <ChatComposer
          disabled={!chat.canSendMessages}
          onFocus={() => scrollToLatest('smooth')}
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
              scrollToLatest('smooth')
            }

            return undefined
          }}
        />
      </div>
    </div>
  )
}
