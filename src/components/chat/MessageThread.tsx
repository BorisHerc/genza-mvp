import type { ChatMessage } from '../../types/marketplace'
import { useTranslation } from '../../context/LocaleContext'
import { MessageBubble } from './MessageBubble'

interface MessageThreadProps {
  messages: ChatMessage[]
}

function shouldGroup(prev: ChatMessage | undefined, current: ChatMessage) {
  if (!prev) return false
  if (prev.senderId !== current.senderId) return false
  const gap = new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime()
  return gap < 5 * 60 * 1000
}

export function MessageThread({ messages }: MessageThreadProps) {
  const { t } = useTranslation()
  let lastDate = ''

  const getDateLabel = (iso: string) => {
    const date = new Date(iso)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return t('time.today')
    if (date.toDateString() === yesterday.toDateString()) return t('chat.yesterday')
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        const dateLabel = getDateLabel(message.createdAt)
        const showDate = dateLabel !== lastDate
        if (showDate) lastDate = dateLabel

        const grouped = shouldGroup(messages[index - 1], message)

        return (
          <div key={message.id}>
            {showDate && (
              <p className="my-4 text-center text-xs font-medium text-gray-400">{dateLabel}</p>
            )}
            <MessageBubble message={message} grouped={grouped} />
          </div>
        )
      })}
    </div>
  )
}
