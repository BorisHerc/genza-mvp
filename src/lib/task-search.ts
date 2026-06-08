import type { Task } from '../types'
import { getCategoryLabel } from './utils'

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function filterTasksBySearchQuery(tasks: Task[], rawQuery: string): Task[] {
  const query = normalizeSearchText(rawQuery)
  if (!query) return tasks

  const terms = query.split(/\s+/).filter(Boolean)

  return tasks.filter((task) => {
    const haystack = normalizeSearchText(
      [task.title, task.description, task.location, getCategoryLabel(task.category)].join(' '),
    )
    return terms.every((term) => haystack.includes(term))
  })
}

export function logTaskSearchResults(query: string, resultCount: number, totalCount: number) {
  console.log('[GENZA SEARCH] query/results count', {
    query: query.trim(),
    results: resultCount,
    total: totalCount,
  })
}
