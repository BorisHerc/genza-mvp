import type { AuthProfile } from '../types/auth'

export const MOCK_DEMO_USER: AuthProfile = {
  id: 'demo-user-1',
  email: 'demo@taskio.com',
  fullName: 'Alex Johnson',
  phone: '+1 (555) 123-4567',
  location: 'Mostar, BiH',
  role: 'user',
  createdAt: '2026-01-15T10:00:00Z',
}

export const MOCK_DEMO_PASSWORD = 'demo123'

export const MOCK_CITIES = [
  'Mostar, BiH',
  'Čapljina, BiH',
  'Međugorje, BiH',
  'Neum, BiH',
  'Ljubuški, BiH',
  'Stolac, BiH',
  'Konjic, BiH',
  'Jablanica, BiH',
]

const STORAGE_KEY = 'taskio_mock_user'

export function loadMockUser(): AuthProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthProfile) : null
  } catch {
    return null
  }
}

export function saveMockUser(user: AuthProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearMockUser() {
  localStorage.removeItem(STORAGE_KEY)
}
