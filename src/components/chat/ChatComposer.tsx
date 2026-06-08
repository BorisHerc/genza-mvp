import { Paperclip, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from '../../context/LocaleContext'
import { Button } from '../ui/Button'

interface ChatComposerProps {
  onSend: (message: string) => Promise<string | undefined>
  onFocus?: () => void
  disabled?: boolean
}

export function ChatComposer({ onSend, onFocus, disabled }: ChatComposerProps) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [message])

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!message.trim()) return

    setIsSending(true)
    setError('')

    const result = await onSend(message.trim())
    setIsSending(false)

    if (result) {
      setError(result)
      return
    }

    setMessage('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="chat-composer-form border-t border-gray-100 bg-white/95 px-4 pt-3 shadow-[0_-4px_24px_-8px_rgb(0_0_0/0.08)] backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
    >
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex items-end gap-2">
        <button
          type="button"
          disabled
          title={t('chat.attachmentSoon')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-300"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder={t('chat.placeholderMultiline')}
          rows={1}
          disabled={disabled || isSending}
          enterKeyHint="send"
          className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <Button
          type="submit"
          disabled={disabled || isSending || !message.trim()}
          className="min-h-11 min-w-11"
          aria-label={t('chat.send')}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
