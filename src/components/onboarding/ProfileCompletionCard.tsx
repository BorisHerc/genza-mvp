import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../context/LocaleContext'
import { Button } from '../ui/Button'

interface ProfileCompletionCardProps {
  className?: string
}

export function ProfileCompletionCard({ className }: ProfileCompletionCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm ${className ?? ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{t('onboarding.completeProfileTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            {t('onboarding.completeProfileHint')}
          </p>
          <Link to="/profile/edit" className="mt-3 inline-flex">
            <Button size="sm" className="min-h-10 gap-1.5">
              {t('onboarding.completeProfileAction')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
