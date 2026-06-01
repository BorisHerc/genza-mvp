import { Star } from 'lucide-react'
import type { ProfileStats, UserMarketplaceStats } from '../../types/profile'
import { formatRating } from '../../lib/profile-text'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface ProfileStatsBarProps {
  stats: ProfileStats
  marketplaceStats?: UserMarketplaceStats
  className?: string
}

export function ProfileStatsBar({ stats, marketplaceStats, className }: ProfileStatsBarProps) {
  const { t } = useTranslation()

  const items = marketplaceStats
    ? [
        { label: t('profile.statsPosted'), value: String(marketplaceStats.postedTasksCount) },
        { label: t('profile.statsActiveClient'), value: String(marketplaceStats.activeJobsAsClient) },
        { label: t('profile.statsActiveTasker'), value: String(marketplaceStats.activeJobsAsTasker) },
        { label: t('profile.statsReviewsReceived'), value: String(marketplaceStats.reviewsReceivedCount) },
        { label: t('profile.statsReviewsWritten'), value: String(marketplaceStats.reviewsWrittenCount) },
      ]
    : [
        { label: t('profile.statsCompleted'), value: String(stats.completedJobsCount) },
        { label: t('profile.statsRating'), value: formatRating(stats.averageRating), icon: stats.averageRating > 0 },
        { label: t('profile.statsReviews'), value: String(stats.reviewsCount) },
      ]

  return (
    <div className={cn('-mx-1 flex gap-3 overflow-x-auto px-1 pb-1', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[7.5rem] shrink-0 rounded-2xl border border-gray-100 bg-white px-3 py-3.5 text-center shadow-card"
        >
          <div className="flex items-center justify-center gap-1">
            {'icon' in item && item.icon && (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            )}
            <p className="text-lg font-bold text-gray-900">{item.value}</p>
          </div>
          <p className="mt-1 text-xs font-medium leading-snug text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
