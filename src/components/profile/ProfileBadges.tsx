import {
  BadgeCheck,
  Briefcase,
  Clock3,
  CreditCard,
  Star,
} from 'lucide-react'
import type { ProfileStats, UserMarketplaceStats } from '../../types/profile'
import { useTranslation } from '../../context/LocaleContext'
import { Badge } from '../ui/Badge'
import { cn } from '../../lib/utils'

interface ProfileBadgesProps {
  verified: boolean
  stats: ProfileStats
  marketplaceStats?: UserMarketplaceStats
  responseLabel?: string
  className?: string
}

export function ProfileBadges({
  verified,
  stats,
  marketplaceStats,
  responseLabel,
  className,
}: ProfileBadgesProps) {
  const { t } = useTranslation()
  const badges = []

  if (verified) {
    badges.push({ key: 'verified', label: t('profile.badgeVerified'), icon: BadgeCheck, variant: 'brand' as const })
  }

  if ((marketplaceStats?.postedTasksCount ?? 0) >= 1) {
    badges.push({ key: 'poster', label: t('profile.badgePoster'), icon: Briefcase, variant: 'default' as const })
  }

  if (stats.completedJobsCount >= 1) {
    badges.push({ key: 'tasker', label: t('profile.badgeActiveTasker'), icon: Star, variant: 'default' as const })
  }

  if (stats.completedJobsCount >= 5) {
    badges.push({ key: 'experienced', label: t('profile.badgeExperienced'), icon: Star, variant: 'warning' as const })
  }

  if (responseLabel) {
    badges.push({ key: 'response', label: responseLabel, icon: Clock3, variant: 'info' as const })
  }

  if (marketplaceStats && marketplaceStats.completedTasksAsClient >= 1) {
    badges.push({
      key: 'paying-client',
      label: t('trust.reliablePayer'),
      icon: CreditCard,
      variant: 'success' as const,
    })
  }

  if (!badges.length) return null

  return (
    <div className={cn('flex flex-wrap justify-center gap-2', className)}>
      {badges.map((badge) => (
        <Badge key={badge.key} variant={badge.variant} className="gap-1">
          <badge.icon className="h-3.5 w-3.5" />
          {badge.label}
        </Badge>
      ))}
    </div>
  )
}
