import type { Offer } from '../types/marketplace'
import { parseOfferMessage } from './offer-message'
import { proximitySortKey, type TaskProximity } from './distance'

export type OfferSortKey = 'price' | 'rating' | 'fastest' | 'closest' | 'newest'

const DURATION_ORDER: Record<string, number> = {
  under_1h: 1,
  '1_2h': 2,
  '2_4h': 3,
  half_day: 4,
  full_day: 5,
  flexible: 6,
}

function durationSortValue(offer: Offer): number {
  const parsed = parseOfferMessage(offer.message)
  if (!parsed.estimatedDuration) return Number.POSITIVE_INFINITY
  return DURATION_ORDER[parsed.estimatedDuration] ?? Number.POSITIVE_INFINITY
}

function proximityKey(proximity?: TaskProximity): number {
  if (!proximity) return Number.POSITIVE_INFINITY
  return proximitySortKey(proximity)
}

export function sortOffers(offers: Offer[], sortKey: OfferSortKey): Offer[] {
  const sorted = [...offers]

  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'price':
        return a.price - b.price
      case 'rating': {
        const ratingDiff = (b.taskerRating ?? 0) - (a.taskerRating ?? 0)
        if (ratingDiff !== 0) return ratingDiff
        return (b.taskerCompletedJobs ?? 0) - (a.taskerCompletedJobs ?? 0)
      }
      case 'fastest':
        return durationSortValue(a) - durationSortValue(b)
      case 'closest':
        return proximityKey(a.proximity) - proximityKey(b.proximity)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return sorted
}

export function getTopRatedOfferId(offers: Offer[]): string | null {
  if (!offers.length) return null
  return sortOffers(offers, 'rating')[0]?.id ?? null
}

export function getResponseMinutes(offerCreatedAt: string, taskPostedAt?: string): number | undefined {
  if (!taskPostedAt) return undefined
  const diffMs = new Date(offerCreatedAt).getTime() - new Date(taskPostedAt).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return 0
  return Math.round(diffMs / 60_000)
}

export type PriceDelta = 'below' | 'above' | 'match'

export function getPriceDelta(offerPrice: number, taskBudget: number): PriceDelta {
  if (offerPrice < taskBudget) return 'below'
  if (offerPrice > taskBudget) return 'above'
  return 'match'
}
