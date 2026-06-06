import { Briefcase, Handshake, Layers } from 'lucide-react'
import type { OnboardingIntent } from '../../types/auth'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface OnboardingIntentStepProps {
  value: OnboardingIntent | null
  onChange: (intent: OnboardingIntent) => void
}

const OPTIONS: Array<{
  id: OnboardingIntent
  icon: typeof Briefcase
}> = [
  { id: 'post', icon: Briefcase },
  { id: 'offer', icon: Handshake },
  { id: 'both', icon: Layers },
]

export function OnboardingIntentStep({ value, onChange }: OnboardingIntentStepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {OPTIONS.map(({ id, icon: Icon }) => {
        const selected = value === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all',
              selected
                ? 'border-brand-600 bg-brand-50 shadow-sm ring-1 ring-brand-200'
                : 'border-gray-200 bg-white hover:border-brand-300',
            )}
          >
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600',
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-gray-900">
                {t(`auth.onboardingIntent.${id}.title`)}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                {t(`auth.onboardingIntent.${id}.description`)}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
