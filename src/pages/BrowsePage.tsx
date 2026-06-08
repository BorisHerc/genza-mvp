import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { PageMeta } from '../components/profile/PageMeta'
import { getMockCategories } from '../data/mockCategories'
import type { TaskCategory } from '../types'
import { CategoryPill } from '../components/tasks/CategoryPill'
import { TaskCard } from '../components/tasks/TaskCard'
import { LocationPromptBanner } from '../components/location/LocationPromptBanner'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { TaskListSkeleton } from '../components/ui/Skeletons'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LocaleContext'
import { useProximityOptions } from '../hooks/useProximityOptions'
import { useTaskSearchQuery } from '../hooks/useTaskSearchQuery'
import { filterAndSortTasks } from '../lib/task-search'
import { getPublicTaskPath } from '../lib/task-slug'
import { listPublicBrowsableTasks } from '../lib/tasks'
import type { Task } from '../types'

export function BrowsePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchQuery = useTaskSearchQuery()
  const { user } = useAuth()
  const proximityOptions = useProximityOptions()
  const mockCategories = getMockCategories()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError('')

      const result = await listPublicBrowsableTasks(user?.id)
      if (cancelled) return

      setTasks(result.tasks)
      setError(result.error ?? '')
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const filteredTasks = useMemo(
    () =>
      filterAndSortTasks({
        tasks,
        searchQuery,
        activeCategory,
        proximityOptions,
      }),
    [tasks, activeCategory, searchQuery, proximityOptions],
  )

  const hasSearchQuery = searchQuery.trim().length > 0
  const hasNoSearchResults = hasSearchQuery && tasks.length > 0 && filteredTasks.length === 0

  const clearSearch = () => {
    navigate('/browse', { replace: true })
  }

  return (
    <>
      <PageMeta
        title={t('browse.metaTitle')}
        description={t('browse.metaDescription')}
        canonicalUrl={`${window.location.origin}/browse`}
        ogTitle={t('browse.ogTitle')}
        ogDescription={t('browse.ogDescription')}
        ogUrl={`${window.location.origin}/browse`}
      />

      <div className="px-4 pt-4 pb-8">
        <header className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-brand-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">{t('browse.label')}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('browse.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('browse.subtitle')}
          </p>
        </header>

        <section aria-label={t('trust.categories')} className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <CategoryPill icon="✨" label={t('categories.all')} active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          {mockCategories.map((category) => (
            <CategoryPill
              key={category.id}
              icon={category.icon}
              label={category.label}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </section>

        <LocationPromptBanner className="mb-5" />

        {isLoading ? (
          <TaskListSkeleton count={4} />
        ) : error ? (
          <ErrorState message={error} onAction={() => window.location.reload()} />
        ) : tasks.length === 0 || hasNoSearchResults || (filteredTasks.length === 0 && activeCategory !== 'all') ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={hasNoSearchResults || hasSearchQuery ? t('search.noResults') : t('tasks.noTasksFound')}
            description={
              hasNoSearchResults || hasSearchQuery
                ? t('search.noResultsHint')
                : activeCategory === 'all'
                  ? t('tasks.noTasksFoundHint')
                  : t('tasks.tryAnotherCategory')
            }
            actionLabel={hasNoSearchResults || hasSearchQuery ? t('search.clearSearch') : t('tasks.viewAllCategories')}
            onAction={() => (hasNoSearchResults || hasSearchQuery ? clearSearch() : setActiveCategory('all'))}
            secondaryActionLabel={hasNoSearchResults || hasSearchQuery ? t('tasks.viewAllCategories') : t('tasks.postTask')}
            onSecondaryAction={() => (hasNoSearchResults || hasSearchQuery ? setActiveCategory('all') : navigate('/post'))}
          />
        ) : (
          <section aria-label={t('browse.label')} className="flex flex-col gap-5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                proximity={task}
                onClick={() => navigate(getPublicTaskPath(task.id, task.title, task.location))}
              />
            ))}
          </section>
        )}
      </div>
    </>
  )
}
