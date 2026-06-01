import { Clock, Zap } from 'lucide-react'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface UrgencySelectorProps {
  value: boolean
  onChange: (urgent: boolean) => void
}

export function UrgencySelector({ value, onChange }: UrgencySelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'rounded-2xl border p-4 text-left transition-all',
          !value
            ? 'border-brand-600 bg-brand-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-brand-300',
        )}
      >
        <Clock className="h-5 w-5 text-gray-500" />
        <p className="mt-2 text-sm font-semibold text-gray-900">{t('tasks.urgency.standard')}</p>
        <p className="mt-1 text-xs text-gray-500">{t('tasks.urgency.standardHint')}</p>
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'rounded-2xl border p-4 text-left transition-all',
          value
            ? 'border-red-500 bg-red-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-red-200',
        )}
      >
        <Zap className="h-5 w-5 text-red-500" />
        <p className="mt-2 text-sm font-semibold text-gray-900">{t('tasks.urgency.urgent')}</p>
        <p className="mt-1 text-xs text-gray-500">{t('tasks.urgency.urgentHint')}</p>
      </button>
    </div>
  )
}
