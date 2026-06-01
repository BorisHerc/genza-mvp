import type { TaskCategory } from '../types'
import { formatCurrency, getActiveCurrency } from './currency'

export const SUGGESTED_BUDGETS: Record<TaskCategory, number[]> = {
  cleaning: [75, 120, 180, 250],
  moving: [150, 250, 400, 600],
  handyman: [60, 100, 150, 220],
  delivery: [25, 45, 75, 120],
  assembly: [50, 90, 140, 200],
  gardening: [70, 110, 160, 240],
  pet_care: [35, 60, 90, 140],
  other: [50, 100, 175, 300],
}

export function getSuggestedBudgets(category: TaskCategory | null) {
  if (!category) return SUGGESTED_BUDGETS.other
  return SUGGESTED_BUDGETS[category] ?? SUGGESTED_BUDGETS.other
}

export function formatSuggestedBudget(
  amount: number,
  currency = getActiveCurrency(),
) {
  return formatCurrency(amount, { currency })
}
