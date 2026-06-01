import { BadgeCheck, Check, Clock, MapPin, Star, Trophy, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Offer } from '../../types/marketplace'
import { formatOfferDuration, parseOfferMessage } from '../../lib/offer-message'
import { getOfferTrustLines } from '../../lib/marketplace-psychology'
import { getOfferStatusLabel } from '../../lib/i18n'
import { useTranslation } from '../../context/LocaleContext'
import { formatRating } from '../../lib/profile-text'
import { formatBudget, formatRelativeTime } from '../../lib/utils'
import { TaskDistanceBadge } from '../location/TaskDistanceBadge'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { cn } from '../../lib/utils'

interface OfferCardProps {
  offer: Offer
  taskBudget?: number
  currency?: import('../../lib/currency').SupportedCurrency
  canAccept?: boolean
  isTopRated?: boolean
  isAccepting?: boolean
  onAccept?: () => void
}

function getTaskerProfilePath(offer: Offer) {
  return offer.taskerUsername ? `/u/${offer.taskerUsername}` : `/tasker/${offer.taskerId}`
}

function formatResponseMinutes(minutes: number, t: (key: string, params?: Record<string, string | number>) => string) {
  if (minutes < 60) return t('offers.responseMinutes', { count: minutes })
  const hours = Math.round(minutes / 60)
  return t('offers.responseHours', { count: hours })
}

export function OfferCard({
  offer,
  taskBudget,
  currency,
  canAccept,
  isTopRated,
  isAccepting,
  onAccept,
}: OfferCardProps) {
  const { t } = useTranslation()
  const profilePath = getTaskerProfilePath(offer)
  const parsed = parseOfferMessage(offer.message)
  const trustLines = getOfferTrustLines({
    verified: offer.taskerVerified,
    completedJobs: offer.taskerCompletedJobs,
    rating: offer.taskerRating,
  })

  return (
    <Card
      className={cn(
        'space-y-4',
        isTopRated && 'ring-2 ring-amber-300 ring-offset-2',
      )}
    >
      {isTopRated && (
        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <Trophy className="h-3.5 w-3.5" />
          {t('offers.topRatedOffer')}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link to={profilePath} className="shrink-0">
            <Avatar name={offer.taskerName} imageUrl={offer.taskerAvatarUrl} size="md" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                to={profilePath}
                className="truncate text-sm font-semibold text-gray-900 hover:text-brand-600"
              >
                {offer.taskerName}
              </Link>
              {offer.taskerVerified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" aria-label={t('trust.verifiedTasker')} />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-gray-700">{formatRating(offer.taskerRating ?? 5)}</span>
                <span>({offer.taskerReviewCount ?? 0})</span>
              </span>
              {(offer.taskerCompletedJobs ?? 0) > 0 && (
                <span>{t('offers.completedJobs', { count: offer.taskerCompletedJobs ?? 0 })}</span>
              )}
              {offer.responseMinutes != null && (
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-brand-500" />
                  {formatResponseMinutes(offer.responseMinutes, t)}
                </span>
              )}
              <span>{formatRelativeTime(offer.createdAt)}</span>
            </div>
            {offer.proximity && (offer.proximity.isNearby || offer.proximity.label) && (
              <div className="mt-1.5">
                <TaskDistanceBadge proximity={offer.proximity} showIcon />
              </div>
            )}
          </div>
        </div>
        <Badge variant={offer.status === 'accepted' ? 'brand' : offer.status === 'pending' ? 'warning' : 'muted'}>
          {getOfferStatusLabel(offer.status)}
        </Badge>
      </div>

      {trustLines.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {trustLines.slice(0, 3).map((line) => (
            <span key={line.text} className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {line.text}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('offers.comparePrice')}</p>
          <p className="text-sm font-bold text-brand-700">{formatBudget(offer.price, 'fixed', currency)}</p>
          {offer.priceDelta && offer.priceDelta !== 'match' && taskBudget != null && (
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">
              {offer.priceDelta === 'below'
                ? t('offers.belowBudget')
                : t('offers.aboveBudget')}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('offers.compareRating')}</p>
          <p className="text-sm font-bold text-gray-900">{formatRating(offer.taskerRating ?? 5)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t('offers.compareEta')}</p>
          <p className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
            <Clock className="h-3.5 w-3.5 text-brand-500" />
            {parsed.estimatedDuration
              ? formatOfferDuration(parsed.estimatedDuration)
              : t('offers.duration.flexible')}
          </p>
        </div>
      </div>

      {parsed.estimatedDuration && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Clock className="h-3.5 w-3.5 text-brand-500" />
          {t('offers.estDuration', { duration: formatOfferDuration(parsed.estimatedDuration) ?? '' })}
        </p>
      )}

      {offer.taskerLocation && (
        <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          {offer.taskerLocation}
        </p>
      )}

      <p className="text-sm leading-relaxed text-gray-600">{parsed.message}</p>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <span className="text-xl font-bold text-brand-700">
          {formatBudget(offer.price, 'fixed', currency)}
        </span>

        {canAccept && offer.status === 'pending' && onAccept && (
          <Button size="sm" onClick={onAccept} disabled={isAccepting} className="min-h-10">
            <Check className="h-4 w-4" />
            {isAccepting ? t('offers.accepting') : t('offers.accept')}
          </Button>
        )}
      </div>
    </Card>
  )
}
