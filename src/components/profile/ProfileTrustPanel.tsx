import {
  Clock3,
  CreditCard,
} from 'lucide-react'
import type { PublicProfile, UserMarketplaceStats } from '../../types/profile'
import { formatJoinedDate } from '../../lib/profile-text'
import {
  getProfileCompletion,
  getTaskerResponseLabel,
} from '../../lib/profile-trust'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'
import { ProfileBadges } from './ProfileBadges'
import { Card } from '../ui/Card'

interface ProfileTrustPanelProps {
  profile: PublicProfile
  marketplaceStats?: UserMarketplaceStats
  showCompletion?: boolean
  className?: string
}

export function ProfileTrustPanel({
  profile,
  marketplaceStats,
  showCompletion = false,
  className,
}: ProfileTrustPanelProps) {
  const { t } = useTranslation()
  const completion = getProfileCompletion(profile)
  const responseLabel =
    profile.stats.completedJobsCount > 0
      ? getTaskerResponseLabel(profile.stats.completedJobsCount)
      : undefined

  return (
    <Card className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{t('profile.trustActivity')}</h2>
        <p className="mt-1 text-xs text-gray-500">{t('profile.trustSignalsDualRole')}</p>
      </div>

      <ProfileBadges
        verified={profile.verified}
        stats={profile.stats}
        marketplaceStats={marketplaceStats}
        responseLabel={responseLabel}
        className="justify-start"
      />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="text-xs font-medium text-gray-500">{t('profile.memberSince')}</div>
          <p className="mt-1 font-semibold text-gray-900">{formatJoinedDate(profile.joinedAt)}</p>
        </div>

        {marketplaceStats && (
          <>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <div className="text-xs font-medium text-gray-500">{t('profile.postedTasks')}</div>
              <p className="mt-1 font-semibold text-gray-900">{marketplaceStats.postedTasksCount}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <div className="text-xs font-medium text-gray-500">{t('profile.statsActiveClient')}</div>
              <p className="mt-1 font-semibold text-gray-900">{marketplaceStats.activeJobsAsClient}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <div className="text-xs font-medium text-gray-500">{t('profile.statsActiveTasker')}</div>
              <p className="mt-1 font-semibold text-gray-900">{marketplaceStats.activeJobsAsTasker}</p>
            </div>
          </>
        )}

        {profile.stats.completedJobsCount > 0 && (
          <div className="rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="text-xs font-medium text-gray-500">{t('profile.completedWork')}</div>
            <p className="mt-1 font-semibold text-gray-900">{profile.stats.completedJobsCount}</p>
          </div>
        )}

        {responseLabel && (
          <div className="col-span-2 rounded-xl bg-brand-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
              <Clock3 className="h-3.5 w-3.5" />
              {t('profile.responseTime')}
            </div>
            <p className="mt-1 text-sm font-semibold text-brand-900">{responseLabel}</p>
          </div>
        )}

        {marketplaceStats && marketplaceStats.completedTasksAsClient >= 1 && (
          <div className="rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <CreditCard className="h-3.5 w-3.5" />
              {t('profile.completedPayments')}
            </div>
            <p className="mt-1 font-semibold text-gray-900">{marketplaceStats.completedTasksAsClient}</p>
          </div>
        )}
      </div>

      {showCompletion && completion.percent < 100 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">{t('profile.profileCompletion')}</span>
            <span className="font-semibold text-brand-700">{completion.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          {completion.missing.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {t('profile.addFieldsToBoost', {
                fields:
                  completion.missing.slice(0, 2).join(', ') +
                  (completion.missing.length > 2 ? '…' : ''),
              })}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
