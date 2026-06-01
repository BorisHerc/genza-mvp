import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Star } from 'lucide-react'
import { ProfileTrustPanel } from '../components/profile/ProfileTrustPanel'
import { EmptyState } from '../components/ui/EmptyState'
import { CompletedWorkList } from '../components/profile/CompletedWorkList'
import { PageMeta } from '../components/profile/PageMeta'
import { ProfileBadges } from '../components/profile/ProfileBadges'
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton'
import { ProfileSkillsTags } from '../components/profile/ProfileSkillsTags'
import { ProfileStatsBar } from '../components/profile/ProfileStatsBar'
import { ReviewAuthoredCard } from '../components/profile/ReviewAuthoredCard'
import { ReviewCard } from '../components/profile/ReviewCard'
import { StarRating } from '../components/profile/StarRating'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { ReportButton } from '../components/moderation/ReportButton'
import { useAuth } from '../context/AuthContext'
import { isUuid } from '../lib/ids'
import { formatJoinedDate, formatRating } from '../lib/profile-text'
import {
  fetchPublicProfileByUserId,
  fetchPublicProfileByUsername,
  getUserMarketplaceStats,
} from '../lib/profiles'
import { getTaskerResponseLabel } from '../lib/profile-trust'
import { useTranslation } from '../context/LocaleContext'
import {
  listCompletedWorkForTasker,
  listPublicReviewsForUser,
  listReviewsWrittenWithDetails,
} from '../lib/reviews'
import type { CompletedWorkItem, PublicProfile, ReviewAuthoredDetails, ReviewWithDetails, UserMarketplaceStats } from '../types/profile'

export function PublicProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const { username, userId } = useParams<{ username?: string; userId?: string }>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reviewsReceived, setReviewsReceived] = useState<ReviewWithDetails[]>([])
  const [reviewsWritten, setReviewsWritten] = useState<ReviewAuthoredDetails[]>([])
  const [completedWork, setCompletedWork] = useState<CompletedWorkItem[]>([])
  const [marketplaceStats, setMarketplaceStats] = useState<UserMarketplaceStats | undefined>()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError('')

      let profileResult

      if (username) {
        profileResult = await fetchPublicProfileByUsername(username)
      } else if (userId && isUuid(userId)) {
        profileResult = await fetchPublicProfileByUserId(userId)
      } else {
        setError(t('profile.notFound'))
        setIsLoading(false)
        return
      }

      if (cancelled) return

      if (!profileResult.profile) {
        setError(profileResult.error ?? t('profile.notFound'))
        setIsLoading(false)
        return
      }

      setProfile(profileResult.profile)

      const [reviewsReceivedResult, reviewsWrittenResult, workResult, statsResult] = await Promise.all([
        listPublicReviewsForUser(profileResult.profile.id),
        listReviewsWrittenWithDetails(profileResult.profile.id),
        listCompletedWorkForTasker(profileResult.profile.id),
        getUserMarketplaceStats(profileResult.profile.id),
      ])

      if (cancelled) return

      setReviewsReceived(reviewsReceivedResult.reviews)
      setReviewsWritten(reviewsWrittenResult.reviews)
      setCompletedWork(workResult.items)
      setMarketplaceStats(statsResult)
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [username, userId, t])

  if (isLoading) return <ProfileSkeleton />

  if (error || !profile) {
    return (
      <ErrorState
        message={error || t('profile.notFound')}
        actionLabel={t('common.goHome')}
        onAction={() => navigate('/')}
      />
    )
  }

  const pageTitle = t('profile.publicTitle', { name: profile.fullName })
  const metaDescription =
    profile.bio?.trim() ||
    t('profile.publicMetaDescription', {
      name: profile.fullName,
      jobs: profile.stats.completedJobsCount,
      rating: formatRating(profile.stats.averageRating),
    })

  return (
    <>
      <PageMeta title={pageTitle} description={metaDescription} />

      <div className="px-4 pt-4 pb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </button>

        {isAuthenticated && user && user.id !== profile.id && (
          <div className="mb-4 flex justify-end">
            <ReportButton
              target={{
                reportedUserId: profile.id,
                label: profile.fullName,
              }}
            />
          </div>
        )}

        <article>
          <header className="mb-6 flex flex-col items-center text-center">
            <Avatar
              name={profile.fullName}
              imageUrl={profile.avatarUrl}
              size="lg"
              className="h-24 w-24 text-2xl"
            />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">{profile.fullName}</h1>
            {profile.username && (
              <p className="mt-1 text-sm text-gray-500">@{profile.username}</p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={Math.round(profile.stats.averageRating) || 0} size="md" />
              <span className="text-sm font-semibold text-gray-700">
                {formatRating(profile.stats.averageRating)}
              </span>
              <span className="text-sm text-gray-400">
                {t('profile.reviewsCountLabel', { count: profile.stats.reviewsCount })}
              </span>
            </div>

            <Badge variant="brand" className="mt-3">
              {profile.systemRole === 'admin' ? t('profile.roleAdmin') : t('profile.roleMember')}
            </Badge>

            <ProfileBadges
              verified={profile.verified}
              stats={profile.stats}
              marketplaceStats={marketplaceStats}
              responseLabel={
                profile.stats.completedJobsCount > 0
                  ? getTaskerResponseLabel(profile.stats.completedJobsCount)
                  : undefined
              }
              className="mt-3"
            />
          </header>

          <ProfileStatsBar
            stats={profile.stats}
            marketplaceStats={marketplaceStats}
            className="mb-4"
          />

          <ProfileTrustPanel profile={profile} marketplaceStats={marketplaceStats} className="mb-4" />

          <Card className="mb-4 space-y-3">
            {profile.location && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="h-4 w-4 shrink-0 text-brand-500" />
              <span>{t('profile.joinedOn', { date: formatJoinedDate(profile.joinedAt) })}</span>
            </div>
          </Card>

          <section className="mb-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">{t('profile.about')}</h2>
            <Card>
              <p className="text-sm leading-relaxed text-gray-600">
                {profile.bio?.trim() || t('profile.bioEmptyPublic')}
              </p>
            </Card>
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">{t('profile.skillsAndCategories')}</h2>
            <Card>
              <ProfileSkillsTags skills={profile.skills} />
            </Card>
          </section>

          {completedWork.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{t('profile.completedAssignments')}</h2>
                <span className="text-sm text-gray-500">{t('profile.jobsCount', { count: completedWork.length })}</span>
              </div>
              <CompletedWorkList
                items={completedWork}
                emptyMessage={t('profile.emptyAssignmentsPublic')}
              />
            </section>
          )}

          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{t('profile.reviewsReceived')}</h2>
              <span className="text-sm text-gray-500">{t('profile.shown', { count: reviewsReceived.length })}</span>
            </div>

            {reviewsReceived.length === 0 ? (
              <EmptyState
                icon={<Star className="h-6 w-6" />}
                title={t('reviews.noReviews')}
                description={t('profile.noReviewsPublic')}
              />
            ) : (
              <div className="space-y-3">
                {reviewsReceived.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </section>

          {reviewsWritten.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{t('profile.reviewsWritten')}</h2>
                <span className="text-sm text-gray-500">{t('profile.shown', { count: reviewsWritten.length })}</span>
              </div>
              <div className="space-y-3">
                {reviewsWritten.map((review) => (
                  <ReviewAuthoredCard key={review.id} review={review} />
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-center">
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-brand-300 hover:bg-brand-50"
            >
              {t('profile.browseOnGenza')}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
