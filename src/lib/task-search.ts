import type { Task, TaskCategory } from '../types'
import type { ProximityOptions, TaskProximity } from './distance'
import { sortTasksByProximity } from './distance'
import { getCategoryLabel } from './utils'

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function buildTaskSearchHaystack(task: Task): string {
  const categorySlug = String(task.category ?? '')
  const categoryLabel = getCategoryLabel(categorySlug)
  return normalizeSearchText(
    [
      task.title,
      task.description,
      task.location,
      categoryLabel,
      categorySlug,
      categorySlug.replace(/_/g, ' '),
    ]
      .filter(Boolean)
      .join(' '),
  )
}

export function filterTasksBySearchQuery(tasks: Task[], rawQuery: string): Task[] {
  const query = normalizeSearchText(rawQuery)
  if (!query) return tasks

  const terms = query.split(/\s+/).filter(Boolean)

  return tasks.filter((task) => {
    const haystack = buildTaskSearchHaystack(task)
    return terms.every((term) => haystack.includes(term))
  })
}

export function filterAndSortTasks(input: {
  tasks: Task[]
  searchQuery: string
  activeCategory: TaskCategory | 'all'
  proximityOptions: ProximityOptions
}): Array<Task & TaskProximity> {
  const { tasks, searchQuery, activeCategory, proximityOptions } = input

  console.log('[GENZA SEARCH] raw tasks count', tasks.length)
  console.log('[GENZA SEARCH] query', searchQuery)

  const byCategory =
    activeCategory === 'all' ? tasks : tasks.filter((task) => task.category === activeCategory)

  const searched = filterTasksBySearchQuery(byCategory, searchQuery)

  console.log('[GENZA SEARCH] filtered count', searched.length)

  return sortTasksByProximity(searched, proximityOptions)
}
