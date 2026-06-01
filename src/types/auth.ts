import type { SupportedCurrency } from '../lib/currency'
import type { SystemRole } from '../lib/roles'

export type { SystemRole }

export interface AuthProfile {
  id: string
  email: string
  fullName: string
  phone: string
  location: string
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
  avatarUrl?: string
}
