import { translate } from './i18n'

const SLUG_MAX_LENGTH = 60

export function generateTaskSlug(title: string, location?: string | null): string {
  const combined = [title, location?.split(',')[0]?.trim()]
    .filter(Boolean)
    .join(' ')

  const slug = combined
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '')

  return slug || 'task'
}

export function getPublicTaskPath(taskId: string, title: string, location?: string | null) {
  const slug = generateTaskSlug(title, location)
  return `/tasks/${taskId}/${slug}`
}

export function buildPublicTaskCanonicalUrl(
  origin: string,
  taskId: string,
  title: string,
  location?: string | null,
) {
  return `${origin.replace(/\/$/, '')}${getPublicTaskPath(taskId, title, location)}`
}

export function buildTaskSeoTitle(title: string, budgetLabel: string, location?: string | null) {
  const city = location?.split(',')[0]?.trim()
  if (city) {
    return translate('meta.taskSeoTitleInCity', { title, city, budget: budgetLabel })
  }
  return translate('meta.taskSeoTitle', { title, budget: budgetLabel })
}

export function buildTaskSeoDescription(task: {
  title: string
  description: string
  location: string
  categoryLabel: string
  budgetLabel: string
}) {
  const snippet = task.description.trim().replace(/\s+/g, ' ').slice(0, 140)
  return translate('meta.taskSeoDescription', {
    category: task.categoryLabel,
    location: task.location,
    budget: task.budgetLabel,
    snippet,
  })
}
