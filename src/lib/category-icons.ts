import type { TaskCategory } from '../types'
import { mockCategories } from '../data/mockCategories'

const iconMap = new Map(mockCategories.map((category) => [category.id, category.icon]))

export function getCategoryIcon(category: TaskCategory | string | null | undefined): string {
  if (!category) return '💡'
  return iconMap.get(category as TaskCategory) ?? '💡'
}
