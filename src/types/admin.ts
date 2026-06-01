import type { SupportedCurrency } from '../lib/currency'

export type ReportStatus = 'open' | 'reviewed' | 'dismissed'

export type AdminTab = 'users' | 'tasks' | 'reports'

export interface ModerationReport {
  id: string
  reporterId: string
  reporterName: string
  reportedUserId?: string
  reportedUserName?: string
  taskId?: string
  taskTitle?: string
  chatId?: string
  messageId?: string
  reason: string
  details?: string
  status: ReportStatus
  createdAt: string
}

export interface AdminUserRecord {
  id: string
  email?: string
  fullName: string
  role: string | null
  location?: string | null
  joinedAt: string
  verified: boolean
  suspended: boolean
  completedJobs: number
  averageRating: number
  reviewCount: number
}

export interface AdminTaskRecord {
  id: string
  title: string
  location: string
  category: string | null
  status: string
  budget: number
  budgetType: string
  currency: SupportedCurrency
  ownerName: string
  ownerId: string
  createdAt: string
  isHidden: boolean
}

export interface ReportChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  createdAt: string
}

export interface SubmitReportInput {
  reporterId: string
  reportedUserId?: string
  taskId?: string
  chatId?: string
  messageId?: string
  reason: string
  details?: string
}

export const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'fraud', label: 'Fraud or misleading' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
] as const
