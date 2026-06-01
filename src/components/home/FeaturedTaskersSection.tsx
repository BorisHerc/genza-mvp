import { BadgeCheck, Briefcase, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublicProfile } from '../../types/profile'
import { getResponseTimeShort } from '../../lib/activity-labels'
import { useTranslation } from '../../context/LocaleContext'
import { getPublicProfilePath } from '../../lib/profiles'
import { formatRating } from '../../lib/profile-text'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'

interface FeaturedTaskerCardProps {
  tasker: PublicProfile
}

export function FeaturedTaskerCard({ tasker }: FeaturedTaskerCardProps) {
  const { t } = useTranslation()
  const profilePath = getPublicProfilePath(tasker)

  return (
    <Link to={profilePath} className="block w-64 shrink-0 snap-start">
      <Card hover className="h-full p-4">
        <div className="flex items-start gap-3">
          <Avatar name={tasker.fullName} imageUrl={tasker.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-bold text-gray-900">{tasker.fullName}</p>
              {tasker.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-500">{tasker.location ?? t('trust.mostarArea')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-700">
                  {formatRating(tasker.stats.averageRating || 5)}
                </span>
                <span>({tasker.stats.reviewsCount})</span>
              </span>
              {tasker.stats.completedJobsCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-brand-500" />
                  {tasker.stats.completedJobsCount} {t('common.jobs')}
                </span>
              )}
            </div>
          </div>
        </div>

        {tasker.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tasker.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs font-medium text-brand-600">
          {getResponseTimeShort(tasker.stats.completedJobsCount)}
        </p>
      </Card>
    </Link>
  )
}

interface FeaturedTaskersSectionProps {
  taskers: PublicProfile[]
}

export function FeaturedTaskersSection({ taskers }: FeaturedTaskersSectionProps) {
  const { t } = useTranslation()

  if (!taskers.length) return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">{t('trust.featuredTaskers')}</h2>
        <span className="text-xs font-medium text-brand-600">{t('trust.popularInMostar')}</span>
      </div>
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {taskers.map((tasker) => (
          <FeaturedTaskerCard key={tasker.id} tasker={tasker} />
        ))}
      </div>
    </section>
  )
}
