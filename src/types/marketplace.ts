import type { TaskProximity } from '../lib/distance'
import type { PriceDelta } from '../lib/offer-sort'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface Offer {
  id: string
  taskId: string
  taskerId: string
  taskerName: string
  taskerAvatarUrl?: string
  taskerUsername?: string | null
  taskerLocation?: string | null
  taskerRating?: number
  taskerReviewCount?: number
  taskerCompletedJobs?: number
  taskerVerified?: boolean
  message: string
  price: number
  status: OfferStatus
  createdAt: string
  /** Distance from task location when listing for the task owner. */
  proximity?: TaskProximity
  /** Minutes from task post to offer submit. */
  responseMinutes?: number
  /** Compared to task budget at list time. */
  priceDelta?: PriceDelta
}

export interface ChatSummary {
  id: string
  taskId: string
  taskTitle: string
  ownerUserId: string
  taskerUserId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatarUrl?: string
  lastMessage?: string
  lastMessageAt?: string
  updatedAt: string
  canSendMessages: boolean
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  message: string
  createdAt: string
  isMine: boolean
}

export type NotificationType =
  | 'new_offer'
  | 'offer_accepted'
  | 'new_message'
  | 'review_received'
  | 'nearby_task'
  | 'task_completed'
  | 'review_needed'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  taskId?: string
  offerId?: string
  chatId?: string
  link?: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface Review {
  id: string
  taskId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
  createdAt: string
}
