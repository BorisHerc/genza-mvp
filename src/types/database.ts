import type { TaskCategory, TaskStatus, User } from './index'
import type { OfferStatus } from './marketplace'
import { translate } from '../lib/i18n'

import type { SupportedCurrency } from '../lib/currency'

export interface ProfileRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'client' | 'tasker' | 'user' | 'admin' | null
  location: string | null
  username: string | null
  bio: string | null
  skills: string[] | null
  service_categories: string[] | null
  last_seen_at: string | null
  verified: boolean | null
  suspended_at: string | null
  currency: SupportedCurrency | null
  created_at: string
}

export interface TaskRow {
  id: number | string
  user_id: string
  title: string
  description: string
  category: TaskCategory | null
  budget: number
  budget_type: string | null
  currency: SupportedCurrency | null
  location: string
  scheduled_date: string | null
  urgent: boolean | null
  images: string[] | null
  status: TaskStatus
  offer_count: number | null
  accepted_offer_id: number | string | null
  assigned_tasker_id: string | null
  is_hidden: boolean | null
  created_at: string
}

export interface OfferRow {
  id: number | string
  task_id: number
  tasker_id: string
  message: string
  price: number
  status: OfferStatus
  created_at: string
}

export interface ChatRow {
  id: number | string
  task_id: number
  user_id: string
  tasker_id: string
  offer_id: string | null
  created_at: string
}

export interface MessageRow {
  id: string
  chat_id: string
  sender_id: string
  message: string
  created_at: string
}

export interface NotificationRow {
  id: string
  user_id: string
  type: 'new_offer' | 'offer_accepted' | 'new_message' | 'review_received'
  title: string
  body: string
  task_id: string | null
  offer_id: string | null
  chat_id: string | null
  read: boolean
  created_at: string
}

export interface ReviewRow {
  id: number | string
  task_id: number
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ReportRow {
  id: number | string
  reporter_id: string
  reported_user_id: string | null
  task_id: number | string | null
  chat_id: number | string | null
  message_id: string | null
  reason: string
  details: string | null
  status: 'open' | 'reviewed' | 'dismissed'
  created_at: string
}

export interface TaskWithRelations extends TaskRow {
  poster?: ProfileRow | null
  assigned_tasker?: ProfileRow | null
}

export function profileToUser(profile: ProfileRow | null | undefined, fallbackId: string): User {
  return {
    id: profile?.id ?? fallbackId,
    name: profile?.full_name?.trim() || translate('common.memberFallback'),
    avatarUrl: profile?.avatar_url ?? undefined,
    rating: 5,
    reviewCount: 0,
    verified: Boolean(profile?.verified ?? true),
    username: profile?.username ?? null,
  }
}
