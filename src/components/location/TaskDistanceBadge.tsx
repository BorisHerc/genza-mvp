import { MapPin } from 'lucide-react'
import type { TaskProximity } from '../../lib/distance'
import { useTranslation } from '../../context/LocaleContext'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'

interface TaskDistanceBadgeProps {
  proximity: Pick<TaskProximity, 'distanceKm' | 'label' | 'isNearby' | 'source'>
  className?: string
  showIcon?: boolean
}

export function TaskDistanceBadge({
  proximity,
  className,
  showIcon = true,
}: TaskDistanceBadgeProps) {
  const { t } = useTranslation()

  if (proximity.source === 'none' && !proximity.label && !proximity.isNearby) {
    return null
  }

  if (proximity.isNearby) {
    return (
      <Badge variant="brand" className={cn('gap-1', className)}>
        {showIcon && <MapPin className="h-3 w-3" />}
        {t('common.nearby')}
      </Badge>
    )
  }

  if (proximity.label) {
    return (
      <span
        className={cn(
          'inline-flex min-h-7 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700',
          className,
        )}
      >
        {showIcon && <MapPin className="h-3 w-3" />}
        {proximity.label}
      </span>
    )
  }

  return null
}
