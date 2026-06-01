import { useEffect, useState, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { ChatListSkeleton } from '../components/ui/Skeletons'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import { useTranslation } from '../context/LocaleContext'
import { listChatsForUser } from '../lib/chats'
import { formatRelativeTime } from '../lib/utils'
import type { ChatSummary } from '../types/marketplace'

export function MessagesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { notifications, refreshNotifications } = useNotifications()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const unreadByChatId = new Map(
    notifications
      .filter((item) => item.type === 'new_message' && !item.read && item.chatId)
      .map((item) => [item.chatId!, true]),
  )

  const loadChats = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    const result = await listChatsForUser(user.id)
    setChats(result.chats)
    setError(result.error ?? '')
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    void loadChats()
    void refreshNotifications()
  }, [loadChats, refreshNotifications, location.key])

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-xl font-bold text-gray-900">{t('messages.title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('messages.subtitle')}</p>

      {isLoading ? (
        <div className="mt-4">
          <ChatListSkeleton />
        </div>
      ) : error ? (
        <div className="mt-4">
          <ErrorState message={error} onAction={() => void loadChats()} />
        </div>
      ) : chats.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" />}
            title={t('messages.emptyConversationsTitle')}
            description={t('messages.emptyConversationsDescription')}
            actionLabel={t('messages.browseTasks')}
            onAction={() => navigate('/browse')}
            secondaryActionLabel={t('tasks.postTask')}
            onSecondaryAction={() => navigate('/post')}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {chats.map((chat) => {
            const hasUnread = unreadByChatId.has(chat.id)

            return (
              <Link key={chat.id} to={`/messages/${chat.id}`}>
                <Card hover className="flex min-h-[72px] items-center gap-3 py-3">
                  <Avatar name={chat.otherUserName} imageUrl={chat.otherUserAvatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {chat.otherUserName}
                      </p>
                      {chat.lastMessageAt && (
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatRelativeTime(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-brand-600">{chat.taskTitle}</p>
                    <p className="truncate text-sm text-gray-500">
                      {chat.lastMessage ?? t('messages.noMessagesPreview')}
                    </p>
                  </div>
                  {hasUnread && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
