import { Briefcase, ClipboardList, MessageCircle, Sparkles, UserCheck, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../context/LocaleContext'
import { dismissWelcome } from '../../lib/profile-trust'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface WelcomeCardProps {
  userId: string
  userName: string
  onDismiss: () => void
}

export function WelcomeCard({ userId, userName, onDismiss }: WelcomeCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const firstName = userName.split(' ')[0] || 'there'

  const steps = [
    {
      icon: ClipboardList,
      title: t('trust.welcomeStep1Title'),
      description: t('trust.welcomeStep1DescDualRole'),
    },
    {
      icon: MessageCircle,
      title: t('trust.welcomeStep2Title'),
      description: t('trust.welcomeStep2Desc'),
    },
    {
      icon: UserCheck,
      title: t('trust.welcomeStep3Title'),
      description: t('trust.welcomeStep3Desc'),
    },
  ]

  const handleDismiss = () => {
    dismissWelcome(userId)
    onDismiss()
  }

  return (
    <Card className="relative mb-6 overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100/40 p-0">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-full p-2 text-gray-400 hover:bg-white/80 hover:text-gray-600"
        aria-label={t('trust.dismissWelcome')}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-5">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
          <Sparkles className="h-3.5 w-3.5" />
          {t('trust.welcomeBadge')}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{t('trust.welcomeTitle', { name: firstName })}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('trust.welcomeSubtitleDualRole')}</p>

        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700 shadow-sm">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-xs leading-relaxed text-gray-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button fullWidth size="sm" onClick={() => navigate('/post')}>
            <ClipboardList className="h-4 w-4" />
            {t('tasks.postTask')}
          </Button>
          <Button fullWidth size="sm" variant="secondary" onClick={() => navigate('/browse')}>
            <Briefcase className="h-4 w-4" />
            {t('trust.findTasks')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
