import { getCategoryLabel } from '../lib/i18n'
import type { Category, TaskCategory } from '../types'

const CATEGORY_META: Array<{ id: TaskCategory; icon: string; taskCount: number }> = [
  { id: 'cleaning', icon: '✨', taskCount: 124 },
  { id: 'moving', icon: '📦', taskCount: 89 },
  { id: 'handyman', icon: '🔧', taskCount: 156 },
  { id: 'delivery', icon: '🚚', taskCount: 67 },
  { id: 'assembly', icon: '🛠️', taskCount: 98 },
  { id: 'gardening', icon: '🌿', taskCount: 45 },
  { id: 'pet_care', icon: '🐾', taskCount: 72 },
  { id: 'other', icon: '💡', taskCount: 34 },
]

export function getMockCategories(): Category[] {
  return CATEGORY_META.map((item) => ({
    ...item,
    label: getCategoryLabel(item.id),
  }))
}

/** @deprecated Use getMockCategories() for localized labels */
export const mockCategories = getMockCategories()
