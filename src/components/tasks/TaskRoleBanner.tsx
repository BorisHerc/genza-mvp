import { Briefcase, User } from 'lucide-react'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface TaskRoleBannerProps {
  role: 'owner' | 'tasker' | null
  statusLabel: string
  className?: string
}

export function TaskRoleBanner({ role, statusLabel, className }: TaskRoleBannerProps) {
  const { t } = useTranslation()

  if (!role) return null

  const isOwner = role === 'owner'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-4 py-3',
        isOwner ? 'border-brand-200 bg-brand-50' : 'border-violet-200 bg-violet-50',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full',
          isOwner ? 'bg-brand-100 text-brand-700' : 'bg-violet-100 text-violet-700',
        )}
      >
        {isOwner ? <User className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {isOwner ? t('tasks.roleOwnerBanner') : t('tasks.roleTaskerBanner')}
        </p>
        <p className={cn('text-sm font-semibold', isOwner ? 'text-brand-800' : 'text-violet-800')}>
          {statusLabel}
        </p>
      </div>
    </div>
  )
}
