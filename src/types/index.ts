export type TaskStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export type TaskCategory =
  | 'cleaning'
  | 'moving'
  | 'handyman'
  | 'delivery'
  | 'assembly'
  | 'gardening'
  | 'pet_care'
  | 'other'

export interface User {
  id: string
  name: string
  avatarUrl?: string
  rating: number
  reviewCount: number
  verified?: boolean
  completedJobsCount?: number
  username?: string | null
}

export interface Task {
  id: string
  userId: string
  title: string
  description: string
  category: TaskCategory
  budget: number
  budgetType: 'fixed' | 'hourly'
  currency: import('../lib/currency').SupportedCurrency
  location: string
  distance?: string
  postedAt: string
  scheduledFor?: string
  status: TaskStatus
  rawStatus?: string
  offerCount: number
  poster: User
  assignedTasker?: User
  acceptedOfferId?: string
  assignedTaskerId?: string
  chatId?: string
  urgent?: boolean
  imageUrl?: string
  imageUrls?: string[]
  isOwner?: boolean
  isAssignedTasker?: boolean
}

export interface Category {
  id: TaskCategory
  label: string
  icon: string
  taskCount: number
}

export type NavItem = {
  id: string
  label: string
  path: string
  icon: 'home' | 'search' | 'plus' | 'messages' | 'user'
}
