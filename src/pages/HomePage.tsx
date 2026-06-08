import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Search, Sparkles, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FeaturedTaskersSection } from '../components/home/FeaturedTaskersSection'
import { LocalActivityFeed } from '../components/home/LocalActivityFeed'
import { LocationPromptBanner } from '../components/location/LocationPromptBanner'
import { RecentlyCompletedStrip } from '../components/home/RecentlyCompletedStrip'
import { TrendingCategoriesSection } from '../components/home/TrendingCategoriesSection'
import { ProfileCompletionCard } from '../components/onboarding/ProfileCompletionCard'
import { WelcomeCard } from '../components/onboarding/WelcomeCard'
import type { TaskCategory } from '../types'
import { CompletedTasksSection } from '../components/tasks/CompletedTasksSection'
import { TaskCard } from '../components/tasks/TaskCard'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { TaskListSkeleton } from '../components/ui/Skeletons'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LocaleContext'
import { useProximityOptions } from '../hooks/useProximityOptions'
import { useTaskSearchQuery } from '../hooks/useTaskSearchQuery'
import { filterAndSortTasks } from '../lib/task-search'
import { listFeaturedTaskers } from '../lib/marketplace-home'
import { isWelcomeDismissed } from '../lib/profile-trust'
import { listReviewsReceivedByUser } from '../lib/reviews'
import { getPublicTaskPath } from '../lib/task-slug'
import { listCompletedAssignedTasks, listOpenTasks, listRecentlyCompletedPublicTasks } from '../lib/tasks'
import type { Review } from '../types/marketplace'
import type { Task } from '../types'
import type { PublicProfile } from '../types/profile'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchQuery = useTaskSearchQuery()
  const { user, needsProfileCompletionReminder } = useAuth()
  const proximityOptions = useProximityOptions()
  const [tasks, setTasks] = useState<Task[]>([])
  const [featuredTaskers, setFeaturedTaskers] = useState<PublicProfile[]>([])
  const [recentlyCompleted, setRecentlyCompleted] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [reviewsByTaskId, setReviewsByTaskId] = useState<Map<string, Review>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(true)
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all')
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (user?.id) {
      setShowWelcome(!isWelcomeDismissed(user.id))
    }
  }, [user?.id])

  const loadTasks = async () => {
    setIsLoading(true)
    setError('')
    const result = await listOpenTasks(user?.id)
    setTasks(result.tasks)
    setError(result.error ?? '')
    setIsLoading(false)
  }

  const loadMarketplaceHighlights = async () => {
    setIsLoadingMarketplace(true)

    const [taskersResult, completedResult] = await Promise.all([
      listFeaturedTaskers(6),
      listRecentlyCompletedPublicTasks(5, user?.id),
    ])

    setFeaturedTaskers(taskersResult.taskers)
    setRecentlyCompleted(completedResult.tasks)
    setIsLoadingMarketplace(false)
  }

  const loadCompletedWork = async () => {
    if (!user?.id) {
      setCompletedTasks([])
      setReviewsByTaskId(new Map())
      return
    }

    setIsLoadingCompleted(true)

    const [tasksResult, reviewsResult] = await Promise.all([
      listCompletedAssignedTasks(user.id),
      listReviewsReceivedByUser(user.id),
    ])

    setCompletedTasks(tasksResult.tasks)

    const reviewMap = new Map<string, Review>()
    for (const review of reviewsResult.reviews) {
      reviewMap.set(review.taskId, review)
    }
    setReviewsByTaskId(reviewMap)
    setIsLoadingCompleted(false)
  }

  useEffect(() => {
    void loadTasks()
    void loadMarketplaceHighlights()
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      void loadCompletedWork()
    } else {
      setCompletedTasks([])
      setReviewsByTaskId(new Map())
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
    <div className="px-4 pt-4 pb-2">
      {user && needsProfileCompletionReminder && <ProfileCompletionCard />}

      {user && showWelcome && !needsProfileCompletionReminder && (
        <WelcomeCard
          userId={user.id}
          userName={user.fullName}
          onDismiss={() => setShowWelcome(false)}
        />
      )}

      {!showWelcome && !needsProfileCompletionReminder && (
        <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-lg shadow-brand-600/20">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t('trust.heroDualRoleBadge')}
            </div>
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
              {t('trust.heroDualRoleTitle')}
            </h1>
            <p className="mt-2 text-sm text-brand-100">{t('trust.heroDualRoleSubtitle')}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="min-h-11 bg-white text-brand-700 hover:bg-brand-50"
              onClick={() => navigate('/post')}
            >
              {t('tasks.postTask')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 border-white/40 bg-transparent text-white hover:bg-white/10"
              onClick={() => navigate('/browse')}
            >
              {t('trust.findTasks')}
            </Button>
          </div>
        </section>
      )}

      {isLoadingMarketplace ? (
        <TaskListSkeleton count={2} />
      ) : (
        <>
          <FeaturedTaskersSection taskers={featuredTaskers} />
          <RecentlyCompletedStrip tasks={recentlyCompleted} />
        </>
      )}

      {user && (
        <section className="mb-6">
          {isLoadingCompleted ? (
            <TaskListSkeleton count={2} />
          ) : completedTasks.length > 0 ? (
            <CompletedTasksSection
              title={t('tasks.completedWork')}
              emptyTitle={t('tasks.noCompletedWork')}
              emptyDescription={t('tasks.noCompletedWorkHint')}
              emptyActionLabel={t('tasks.browseOpenTasks')}
              onEmptyAction={() => navigate('/browse')}
              tasks={completedTasks}
              reviewsByTaskId={reviewsByTaskId}
            />
          ) : null}
        </section>
      )}

      <TrendingCategoriesSection
        tasks={tasks}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <LocationPromptBanner />

      {!isLoading && !hasSearchQuery && tasks.length > 0 && <LocalActivityFeed tasks={tasks} />}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-bold text-gray-900">{t('tasks.tasksNearYou')}</h2>
          </div>
          {!isLoading && !error && (
            <span className="text-sm text-gray-500">{t('tasks.available', { count: filteredTasks.length })}</span>
          )}
        </div>

        {isLoading ? (
          <TaskListSkeleton count={3} />
        ) : error ? (
          <ErrorState message={error} onAction={() => void loadTasks()} />
        ) : tasks.length === 0 || hasNoSearchResults || (filteredTasks.length === 0 && activeCategory !== 'all') ? (
          <EmptyState
            icon={hasNoSearchResults || hasSearchQuery ? <Search className="h-6 w-6" /> : <ClipboardList className="h-6 w-6" />}
            title={hasNoSearchResults || hasSearchQuery ? t('search.noResults') : t('tasks.noOpenTasks')}
            description={
              hasNoSearchResults || hasSearchQuery
                ? t('search.noResultsHint')
                : activeCategory === 'all'
                  ? t('tasks.noOpenTasksHint')
                  : t('tasks.tryAnotherCategory')
            }
            actionLabel={hasNoSearchResults || hasSearchQuery ? t('search.clearSearch') : t('tasks.postTask')}
            onAction={() => (hasNoSearchResults || hasSearchQuery ? clearSearch() : navigate('/post'))}
            secondaryActionLabel={
              hasNoSearchResults || hasSearchQuery
                ? t('tasks.browseAllTasks')
                : activeCategory !== 'all'
                  ? t('tasks.clearFilter')
                  : t('tasks.browseAllTasks')
            }
            onSecondaryAction={() => {
              if (hasNoSearchResults || hasSearchQuery) {
                clearSearch()
                return
              }
              if (activeCategory !== 'all') {
                setActiveCategory('all')
                return
              }
              navigate('/browse')
            }}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                proximity={task}
                onClick={() => navigate(getPublicTaskPath(task.id, task.title, task.location))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
