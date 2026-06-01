import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Edit3, ExternalLink, LogOut, MapPin, Shield, Star } from 'lucide-react'
import { LanguageSwitcher } from '../components/i18n/LanguageSwitcher'
import { CompletedWorkList } from '../components/profile/CompletedWorkList'
import { PageMeta } from '../components/profile/PageMeta'
import { ProfileBadges } from '../components/profile/ProfileBadges'
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton'
import { ProfileSkillsTags } from '../components/profile/ProfileSkillsTags'
import { ProfileStatsBar } from '../components/profile/ProfileStatsBar'
import { ProfileTrustPanel } from '../components/profile/ProfileTrustPanel'
import { ReviewAuthoredCard } from '../components/profile/ReviewAuthoredCard'
import { ReviewCard } from '../components/profile/ReviewCard'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'
import { formatJoinedDate } from '../lib/profile-text'
import { useTranslation } from '../context/LocaleContext'
import { fetchOwnProfileDashboard, getPublicProfilePath, getUserMarketplaceStats } from '../lib/profiles'
import { getTaskerResponseLabel } from '../lib/profile-trust'
import {
  listCompletedWorkForTasker,
  listPublicReviewsForUser,
  listReviewsWrittenWithDetails,
} from '../lib/reviews'
import type { CompletedWorkItem, PublicProfile, ReviewAuthoredDetails, ReviewWithDetails, UserMarketplaceStats } from '../types/profile'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reviewsReceived, setReviewsReceived] = useState<ReviewWithDetails[]>([])
  const [reviewsWritten, setReviewsWritten] = useState<ReviewAuthoredDetails[]>([])
  const [completedWork, setCompletedWork] = useState<CompletedWorkItem[]>([])
  const [marketplaceStats, setMarketplaceStats] = useState<UserMarketplaceStats | undefined>()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      const profileResult = await fetchOwnProfileDashboard(user.id)
      if (cancelled) return

      if (!profileResult.profile) {
        setError(profileResult.error ?? t('profile.loadFailed'))
        setIsLoading(false)
        return
      }

      setProfile(profileResult.profile)

      const [reviewsReceivedResult, reviewsWrittenResult, workResult, statsResult] = await Promise.all([
        listPublicReviewsForUser(user.id),
        listReviewsWrittenWithDetails(user.id),
        listCompletedWorkForTasker(user.id),
        getUserMarketplaceStats(user.id),
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
  }, [user?.id, t])

  if (!user) return null

  if (isLoading) return <ProfileSkeleton />

  if (error || !profile) {
    return (
      <ErrorState
        message={error || t('profile.loadFailed')}
        actionLabel={t('common.tryAgain')}
        onAction={() => window.location.reload()}
      />
    )
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    navigate('/auth/login', { replace: true })
  }

  const publicPath = getPublicProfilePath(profile)
  const isAdmin = user.role === 'admin'
  const metaDescription = profile.bio
    ? profile.bio.slice(0, 150)
    : t('profile.metaDescriptionOwn', {
        name: profile.fullName,
        jobs: profile.stats.completedJobsCount,
        reviews: profile.stats.reviewsCount,
      })

  return (
    <>
      <PageMeta
        title={t('profile.metaTitleOwn', { name: profile.fullName })}
        description={metaDescription}
      />

      <div className="px-4 pt-6 pb-8">
        <section className="mb-6 flex flex-col items-center text-center">
          <Avatar
            name={profile.fullName}
            imageUrl={profile.avatarUrl}
            size="lg"
            className="h-24 w-24 text-2xl"
          />
          <h1 className="mt-4 text-xl font-bold text-gray-900">{profile.fullName}</h1>
          {profile.username && (
            <p className="mt-1 text-sm text-gray-500">@{profile.username}</p>
          )}
          <Badge variant="brand" className="mt-3">
            {isAdmin ? t('profile.roleAdmin') : t('profile.roleMember')}
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

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => navigate('/profile/edit')}>
              <Edit3 className="h-4 w-4" />
              {t('profile.edit')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(publicPath)}>
              <ExternalLink className="h-4 w-4" />
              {t('profile.publicView')}
            </Button>
            {isAdmin && (
              <Button size="sm" variant="secondary" onClick={() => navigate('/admin')}>
                <Shield className="h-4 w-4" />
                {t('admin.title')}
              </Button>
            )}
          </div>
        </section>

        <ProfileStatsBar
          stats={profile.stats}
          marketplaceStats={marketplaceStats}
          className="mb-4"
        />

        <ProfileTrustPanel
          profile={profile}
          marketplaceStats={marketplaceStats}
          showCompletion
          className="mb-4"
        />

        <Card className="mb-4 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
            <span>{profile.location || t('profile.locationNotSet')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="h-4 w-4 shrink-0 text-brand-500" />
            <span>{t('profile.joinedOn', { date: formatJoinedDate(profile.joinedAt) })}</span>
          </div>
        </Card>

        <section className="mb-4">
          <h2 className="mb-2 text-base font-bold text-gray-900">{t('profile.about')}</h2>
          <Card>
            <p className="text-sm leading-relaxed text-gray-600">
              {profile.bio?.trim() || t('profile.bioPlaceholder')}
            </p>
          </Card>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-gray-900">{t('profile.skills')}</h2>
          <Card>
            <ProfileSkillsTags skills={profile.skills} />
          </Card>
        </section>

        {completedWork.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{t('profile.completedWork')}</h2>
              <span className="text-sm text-gray-500">{t('profile.jobsCount', { count: completedWork.length })}</span>
            </div>
            <CompletedWorkList items={completedWork} />
          </section>
        )}

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{t('profile.reviewsReceived')}</h2>
            <span className="text-sm text-gray-500">{t('profile.reviewsTotal', { count: reviewsReceived.length })}</span>
          </div>

          {reviewsReceived.length === 0 ? (
            <EmptyState
              icon={<Star className="h-6 w-6" />}
              title={t('reviews.noReviews')}
              description={t('profile.noReviewsHintOwn')}
            />
          ) : (
            <div className="space-y-3">
              {reviewsReceived.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{t('profile.reviewsWritten')}</h2>
            <span className="text-sm text-gray-500">{t('profile.reviewsTotal', { count: reviewsWritten.length })}</span>
          </div>

          {reviewsWritten.length === 0 ? (
            <EmptyState
              icon={<Star className="h-6 w-6" />}
              title={t('profile.noReviewsWritten')}
              description={t('profile.noReviewsWrittenHint')}
            />
          ) : (
            <div className="space-y-3">
              {reviewsWritten.map((review) => (
                <ReviewAuthoredCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        <Card className="mb-4">
          <LanguageSwitcher />
        </Card>

        <Card className="mb-4 space-y-2 text-sm text-gray-600">
          <p>{user.email}</p>
          {user.phone && <p>{user.phone}</p>}
          <Link to={publicPath} className="inline-flex text-brand-600 hover:text-brand-700">
            {t('profile.viewPublicProfile')}
          </Link>
        </Card>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? t('auth.signingOut') : t('auth.signOut')}
        </Button>
      </div>
    </>
  )
}
