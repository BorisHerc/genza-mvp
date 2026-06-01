import { MessageCircle } from 'lucide-react'
import { useTranslation } from '../../context/LocaleContext'

export function ChatEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <MessageCircle className="h-7 w-7" />
      </span>
      <p className="text-sm font-semibold text-gray-900">{t('chat.emptyTitle')}</p>
      <p className="mt-1 max-w-xs text-sm text-gray-500">
        {t('chat.emptyDescriptionMatch')}
      </p>
    </div>
  )
}
