import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
import { sortTasksByProximity } from '../lib/distance'
import { filterTasksBySearchQuery, logTaskSearchResults } from '../lib/task-search'
import { getPublicTaskPath } from '../lib/task-slug'
import { listPublicBrowsableTasks } from '../lib/tasks'
import type { Task } from '../types'

export function BrowsePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const proximityOptions = useProximityOptions()
  const mockCategories = getMockCategories()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') ?? ''
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

  const filteredTasks = useMemo(() => {
    const byCategory =
      activeCategory === 'all' ? tasks : tasks.filter((task) => task.category === activeCategory)
    const searched = filterTasksBySearchQuery(byCategory, searchQuery)
    const sorted = sortTasksByProximity(searched, proximityOptions)
    logTaskSearchResults(pathname, searchQuery, sorted.length, tasks.length)
    return sorted
  }, [tasks, activeCategory, searchQuery, proximityOptions, pathname])

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
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={searchQuery.trim() ? t('search.noResults') : t('tasks.noTasksFound')}
            description={
              searchQuery.trim()
                ? t('search.noResultsHint')
                : activeCategory === 'all'
                  ? t('tasks.noTasksFoundHint')
                  : t('tasks.tryAnotherCategory')
            }
            actionLabel={searchQuery.trim() ? t('search.clearSearch') : t('tasks.viewAllCategories')}
            onAction={() => (searchQuery.trim() ? clearSearch() : setActiveCategory('all'))}
            secondaryActionLabel={searchQuery.trim() ? t('tasks.viewAllCategories') : t('tasks.postTask')}
            onSecondaryAction={() => (searchQuery.trim() ? setActiveCategory('all') : navigate('/post'))}
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
