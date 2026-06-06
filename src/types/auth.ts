import type { SupportedCurrency } from '../lib/currency'
import type { SystemRole } from '../lib/roles'
import type { TaskCategory } from './index'

export type StartingPrices = Partial<Record<TaskCategory, number>>
export type OnboardingIntent = 'post' | 'offer' | 'both'
export type { SystemRole }

export interface AuthProfile {
  id: string
  email: string
  fullName: string
  phone: string
  location: string
  neighborhood?: string
  latitude?: number | null
  longitude?: number | null
  serviceCategories?: TaskCategory[]
  startingPrices?: StartingPrices
  availabilityEnabled?: boolean
  onboardingIntent?: OnboardingIntent | null
  currency?: SupportedCurrency
  /** Normalized app role: `user` or `admin`. */
  role: SystemRole
  avatarUrl?: string
  createdAt: string
}

export interface SignUpCredentials {
  email: string
  password: string
}

export interface ProfileSetupData {
  fullName: string
  phone: string
  location: string
  neighborhood?: string
  latitude?: number | null
  longitude?: number | null
  onboardingIntent?: OnboardingIntent
  serviceCategories?: TaskCategory[]
  startingPrices?: StartingPrices
  availabilityEnabled?: boolean
  notificationEmail?: string
  avatarUrl?: string
  avatarFile?: File
  skipped?: boolean
}
