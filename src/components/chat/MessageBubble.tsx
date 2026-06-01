import type { ChatMessage } from '../../types/marketplace'
import { cn } from '../../lib/utils'

export function MessageBubble({ message, grouped = false }: { message: ChatMessage; grouped?: boolean }) {
  return (
    <div className={cn('flex', message.isMine ? 'justify-end' : 'justify-start', grouped && '-mt-1')}>
      <div
        className={cn(
          'max-w-[85%] px-4 py-2.5 text-sm shadow-sm',
          message.isMine
            ? cn('rounded-2xl bg-brand-600 text-white', grouped ? 'rounded-tr-md' : 'rounded-br-md')
            : cn(
                'rounded-2xl border border-gray-100 bg-white text-gray-700',
                grouped ? 'rounded-tl-md' : 'rounded-bl-md',
              ),
        )}
      >
        {!message.isMine && !grouped && (
          <p className="mb-1 text-xs font-semibold text-brand-600">{message.senderName}</p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        {!grouped && (
          <p
            className={cn(
              'mt-1 text-[10px]',
              message.isMine ? 'text-brand-100' : 'text-gray-400',
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
