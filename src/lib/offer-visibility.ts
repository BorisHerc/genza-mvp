import type { Offer } from '../types/marketplace'
import type { Task } from '../types'

export function canViewTaskOfferInsights(input: {
  task: Pick<Task, 'isOwner'>
  isAdmin?: boolean
}): boolean {
  return Boolean(input.task.isOwner || input.isAdmin)
}

export function filterOffersForViewer(
  offers: Offer[],
  input: {
    viewerUserId?: string
    canViewAllOffers: boolean
  },
): Offer[] {
  if (input.canViewAllOffers) return offers
  if (!input.viewerUserId) return []
  const viewerId = input.viewerUserId.toLowerCase()
  return offers.filter((offer) => offer.taskerId.toLowerCase() === viewerId)
}
