import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ChatSummary } from '../../types/marketplace'
import { Avatar } from '../ui/Avatar'

interface ChatHeaderProps {
  chat: ChatSummary
  onBack: () => void
}

export function ChatHeader({ chat, onBack }: ChatHeaderProps) {
  return (
    <div className="border-b border-gray-100 bg-white px-4 py-3">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Messages
      </button>

      <div className="flex items-center gap-3">
        <Avatar name={chat.otherUserName} imageUrl={chat.otherUserAvatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-gray-900">{chat.otherUserName}</h1>
          {chat.taskId ? (
            <Link
              to={`/tasks/${chat.taskId}`}
              className="truncate text-sm text-brand-600 hover:text-brand-700"
            >
              {chat.taskTitle}
            </Link>
          ) : (
            <p className="truncate text-sm text-gray-500">{chat.taskTitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
