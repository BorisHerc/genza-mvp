import type { SupportedCurrency } from '../lib/currency'
import type { LegacyProfileRole, SystemRole } from '../lib/roles'
import type { TaskCategory } from './index'

export interface ProfileStats {
  completedJobsCount: number
  averageRating: number
  reviewsCount: number
}

/** @deprecated Use UserMarketplaceStats — kept for backward compatibility. */
export interface ClientTrustStats {
  postedTasksCount: number
  completedPaymentsCount: number
}

export interface UserMarketplaceStats {
  postedTasksCount: number
  activeJobsAsClient: number
  activeJobsAsTasker: number
  reviewsReceivedCount: number
  reviewsWrittenCount: number
  completedJobsAsTasker: number
  completedTasksAsClient: number
}

export interface PublicProfile {
  id: string
  username: string | null
  fullName: string
  avatarUrl?: string
  /** Stored DB role (legacy client/tasker or user/admin). */
  role: LegacyProfileRole | null
  systemRole: SystemRole
  location: string | null
  bio: string | null
  skills: string[]
  serviceCategories: TaskCategory[]
  verified: boolean
  joinedAt: string
  stats: ProfileStats
  currency?: SupportedCurrency
}

export interface ReviewWithDetails {
  id: string
  taskId: string
  taskTitle: string
  taskCategory: TaskCategory | null
  reviewerId: string
  reviewerName: string
  revieweeId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface ReviewAuthoredDetails {
  id: string
  taskId: string
  taskTitle: string
  taskCategory: TaskCategory | null
  revieweeId: string
  revieweeName: string
  rating: number
  comment?: string
  createdAt: string
}

export interface CompletedWorkItem {
  id: string
  title: string
  category: TaskCategory | null
  completedAt: string
  review?: {
    rating: number
    comment?: string
  }
}

export interface ProfileEditInput {
  fullName: string
  username: string
  location: string
  bio: string
  skills: string[]
  serviceCategories: TaskCategory[]
  avatarUrl?: string | null
  currency?: SupportedCurrency
}
