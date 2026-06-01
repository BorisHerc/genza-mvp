import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CheckCircle,
  MapPin,
  MessageCircle,
  Play,
  RotateCcw,
  Handshake,
  Users,
  XCircle,
} from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { PageMeta } from '../components/profile/PageMeta'
import { TaskDistanceBadge } from '../components/location/TaskDistanceBadge'
import { AcceptOfferDialog } from '../components/offers/AcceptOfferDialog'
import { CreateOfferForm } from '../components/offers/CreateOfferForm'
import { OfferCard } from '../components/offers/OfferCard'
import { OfferComparisonList } from '../components/offers/OfferComparisonList'
import { TaskAssignmentBanner } from '../components/tasks/TaskAssignmentBanner'
import { TaskCancelledPanel, TaskReopenHint } from '../components/tasks/TaskCancelledPanel'
import { TaskCompletedPanel } from '../components/tasks/TaskCompletedPanel'
import { TaskLifecycleTimeline } from '../components/tasks/TaskLifecycleTimeline'
import { TaskPublicSkeleton } from '../components/tasks/TaskPublicSkeleton'
import { TaskStatusBadge } from '../components/tasks/TaskStatusBadge'
import { ReportButton } from '../components/moderation/ReportButton'
import { TrustProfileCard } from '../components/tasks/TrustProfileCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  acceptOffer,
  cancelAssignment,
  completeTask,
  createOffer,
  listOffersForTask,
  reopenTask,
  startTaskProgress,
} from '../lib/offers'
import { ensureChatForTask, getChatIdForTask } from '../lib/chats'
import {
  buildPublicTaskCanonicalUrl,
  buildTaskSeoDescription,
  buildTaskSeoTitle,
  generateTaskSlug,
  getPublicTaskPath,
} from '../lib/task-slug'
import { getPublicTaskById } from '../lib/tasks'
import { normalizeTaskStatus, isKnownTaskStatus, isTaskCancelled, isTaskCompleted } from '../lib/task-status'
import { formatBudget, formatRelativeTime, getCategoryLabel } from '../lib/utils'
import { formatOffersCount } from '../lib/i18n'
import { useTranslation } from '../context/LocaleContext'
import { useProximityOptions } from '../hooks/useProximityOptions'
import { getTaskProximity } from '../lib/distance'
import type { Offer } from '../types/marketplace'
import type { Task, User } from '../types'

function mergeOfferList(existing: Offer[], incoming: Offer[]) {
  const byId = new Map<string, Offer>()
  for (const offer of incoming) byId.set(offer.id, offer)
  for (const offer of existing) {
    if (!byId.has(offer.id)) byId.set(offer.id, offer)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function getUserProfilePath(user: User) {
  return user.username ? `/u/${user.username}` : `/tasker/${user.id}`
}

export function PublicTaskPage() {
  const { taskId, slug } = useParams<{ taskId: string; slug?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const toast = useToast()
  const proximityOptions = useProximityOptions()
  const [task, setTask] = useState<Task | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptDialogOffer, setAcceptDialogOffer] = useState<Offer | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [offerSubmitted, setOfferSubmitted] = useState(false)
  const [resolvedChatId, setResolvedChatId] = useState<string | undefined>()

  const loginRedirect = `${location.pathname}${location.search}`

  const refreshTaskAndOffers = useCallback(async () => {
    if (!taskId) return

    const taskResult = await getPublicTaskById(taskId, user?.id)
    if (!taskResult.task) {
      setError(taskResult.error ?? t('tasks.notFound'))
      setTask(null)
      setOffers([])
      return
    }

    setError('')
    setTask(taskResult.task)

    if (user?.id) {
      const context = {
        taskLocation: taskResult.task.location,
        taskPostedAt: taskResult.task.postedAt,
        taskBudget: taskResult.task.budget,
      }
      const offersResult = await listOffersForTask(taskId, context)
      setOffers((current) => mergeOfferList(current, offersResult.offers))
    }
  }, [taskId, user?.id, t])

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      if (!taskId) return
      setIsLoading(true)
      setError('')

      const taskResult = await getPublicTaskById(taskId, user?.id)
      if (cancelled) return

      if (!taskResult.task) {
        setError(taskResult.error ?? t('tasks.notFound'))
        setTask(null)
        setOffers([])
        setIsLoading(false)
        return
      }

      setTask(taskResult.task)

      if (user?.id) {
        const context = {
          taskLocation: taskResult.task.location,
          taskPostedAt: taskResult.task.postedAt,
          taskBudget: taskResult.task.budget,
        }
        const offersResult = await listOffersForTask(taskId, context)
        if (!cancelled) setOffers(offersResult.offers)
      } else {
        setOffers([])
      }

      setIsLoading(false)
    }

    void loadInitial()
    return () => {
      cancelled = true
    }
  }, [taskId, user?.id])

  const pendingOffers = useMemo(
    () => offers.filter((offer) => offer.status === 'pending'),
    [offers],
  )

  const myPendingOffer = useMemo(
    () =>
      user
        ? pendingOffers.find(
            (offer) => offer.taskerId.toLowerCase() === user.id.toLowerCase(),
          )
        : undefined,
    [pendingOffers, user],
  )

  const displayOfferCount = Math.max(task?.offerCount ?? 0, pendingOffers.length)

  const taskStatus = normalizeTaskStatus(task?.rawStatus ?? task?.status)
  const isCompleted =
    task?.status === 'completed' ||
    isTaskCompleted(task?.rawStatus) ||
    isTaskCompleted(task?.status)
  const isCancelled =
    task?.status === 'cancelled' ||
    isTaskCancelled(task?.rawStatus) ||
    isTaskCancelled(task?.status)
  const isOpen = taskStatus === 'open' && !isCompleted && !isCancelled
  const isAssigned = taskStatus === 'assigned' && !isCompleted && !isCancelled
  const isInProgress = taskStatus === 'in_progress' && !isCompleted && !isCancelled
  const hasAssignmentHistory = Boolean(task?.assignedTaskerId || task?.assignedTasker)
  const hasKnownStatus = task ? isKnownTaskStatus(task.rawStatus ?? task.status) : true

  const canonicalSlug = task ? generateTaskSlug(task.title, task.location) : ''
  const canonicalPath = task ? getPublicTaskPath(task.id, task.title, task.location) : ''

  const showChatCard = Boolean(
    user &&
      task &&
      (task.isOwner || task.isAssignedTasker) &&
      (isAssigned || isInProgress || isCompleted || (isCancelled && hasAssignmentHistory)) &&
      resolvedChatId,
  )

  useEffect(() => {
    if (!task || !user?.id) {
      setResolvedChatId(undefined)
      return
    }

    const isParticipant = task.isOwner || task.isAssignedTasker
    const canChat =
      isParticipant &&
      (isAssigned || isInProgress || isCompleted || (isCancelled && hasAssignmentHistory))
    if (!canChat) {
      setResolvedChatId(undefined)
      return
    }

    const activeTask = task
    const activeUser = user
    let cancelled = false

    async function resolveChat() {
      if (activeTask.chatId) {
        if (!cancelled) setResolvedChatId(activeTask.chatId)
        return
      }

      const lookup = await getChatIdForTask(activeTask.id, activeUser.id)
      if (cancelled) return

      if (lookup.chatId) {
        setResolvedChatId(lookup.chatId)
        return
      }

      if (activeTask.isOwner && activeTask.assignedTaskerId) {
        const ensured = await ensureChatForTask({
          taskId: activeTask.id,
          ownerId: activeTask.userId,
          taskerId: activeTask.assignedTaskerId,
          offerId: activeTask.acceptedOfferId,
          requesterId: activeUser.id,
        })
        if (!cancelled) setResolvedChatId(ensured.chatId)
      }
    }

    void resolveChat()
    return () => {
      cancelled = true
    }
  }, [task, user?.id, isAssigned, isInProgress, isCompleted, isCancelled, hasAssignmentHistory])

  const canOffer = Boolean(
    user &&
      task &&
      !task.isOwner &&
      !task.isAssignedTasker &&
      isOpen &&
      !myPendingOffer,
  )

  const handleAcceptOffer = async (offerId: string) => {
    if (!task || !user || !taskId) return
    setAcceptingId(offerId)
    setActionError('')

    const result = await acceptOffer(user.id, taskId, offerId)
    setAcceptingId(null)
    setAcceptDialogOffer(null)

    if (result.error) {
      toast.error(result.error)
      setActionError(result.error)
      return
    }

    toast.success(t('tasks.offerAccepted'))

    setIsRefreshing(true)
    await refreshTaskAndOffers()
    setIsRefreshing(false)

    if (result.chatId) navigate(`/messages/${result.chatId}`)
  }

  const handleRequestAccept = (offer: Offer) => {
    setAcceptDialogOffer(offer)
  }

  const handleStart = async () => {
    if (!task || !user || !taskId) return
    setIsUpdatingStatus(true)
    setActionError('')
    const result = await startTaskProgress(taskId, user.id)
    setIsUpdatingStatus(false)
    if (result.error) {
      toast.error(result.error)
      setActionError(result.error)
    } else {
      toast.success(t('tasks.inProgressSuccess'))
      setIsRefreshing(true)
      await refreshTaskAndOffers()
      setIsRefreshing(false)
    }
  }

  const handleComplete = async () => {
    if (!task || !user || !taskId) return
    setIsUpdatingStatus(true)
    setActionError('')
    const result = await completeTask(taskId, user.id)
    setIsUpdatingStatus(false)
    if (!result.success || result.error) {
      toast.error(result.error ?? t('tasks.completedFailed'))
      setActionError(result.error ?? t('tasks.completedFailed'))
    } else {
      toast.success(t('tasks.completedSuccess'))
      setTask((current) =>
        current ? { ...current, status: 'completed', rawStatus: 'completed' } : current,
      )
      setIsRefreshing(true)
      await refreshTaskAndOffers()
      setIsRefreshing(false)
    }
  }

  const handleCancelAssignment = async () => {
    if (!task || !user || !taskId) return
    setIsUpdatingStatus(true)
    setActionError('')
    const result = await cancelAssignment(taskId, user.id)
    setIsUpdatingStatus(false)
    if (!result.success || result.error) {
      toast.error(result.error ?? t('tasks.cancelFailed'))
      setActionError(result.error ?? t('tasks.cancelFailed'))
    } else {
      toast.success(t('tasks.cancelSuccess'))
      setIsRefreshing(true)
      await refreshTaskAndOffers()
      setIsRefreshing(false)
    }
  }

  const handleReopen = async () => {
    if (!task || !user || !taskId) return
    setIsUpdatingStatus(true)
    setActionError('')
    const result = await reopenTask(taskId, user.id)
    setIsUpdatingStatus(false)
    if (!result.success || result.error) {
      toast.error(result.error ?? t('tasks.reopenFailed'))
      setActionError(result.error ?? t('tasks.reopenFailed'))
    } else {
      toast.success(t('tasks.reopenSuccess'))
      setIsRefreshing(true)
      await refreshTaskAndOffers()
      setIsRefreshing(false)
    }
  }

  const handleCreateOffer = async (input: { message: string; price: number }) => {
    if (!taskId || !user) return t('tasks.signInToOffer')

    const result = await createOffer(user.id, {
      taskId,
      message: input.message,
      price: input.price,
    })

    if (result.error || !result.offer) {
      return result.error ?? t('tasks.offerSubmitFailed')
    }

    setOffers((current) => mergeOfferList(current, [result.offer!]))
    setTask((current) =>
      current
        ? { ...current, offerCount: Math.max(current.offerCount + 1, pendingOffers.length + 1) }
        : current,
    )
    setOfferSubmitted(true)
    setActionError('')
    toast.success(t('tasks.offerSubmitted'))
    void refreshTaskAndOffers()
    return undefined
  }

  if (isLoading) return <TaskPublicSkeleton />

  if (error || !task) {
    return (
      <ErrorState
        message={error || t('tasks.notFound')}
        actionLabel={t('tasks.browseTasks')}
        onAction={() => navigate('/browse')}
      />
    )
  }

  if (slug !== canonicalSlug) {
    return <Navigate to={canonicalPath} replace />
  }

  const budgetLabel = formatBudget(task.budget, task.budgetType, task.currency)
  const taskProximity = getTaskProximity(task.location, proximityOptions)
  const seoTitle = buildTaskSeoTitle(task.title, budgetLabel, task.location)
  const seoDescription = buildTaskSeoDescription({
    title: task.title,
    description: task.description,
    location: task.location,
    categoryLabel: getCategoryLabel(task.category),
    budgetLabel,
  })
  const canonicalUrl = buildPublicTaskCanonicalUrl(
    window.location.origin,
    task.id,
    task.title,
    task.location,
  )

  return (
    <>
      <PageMeta
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        ogTitle={seoTitle}
        ogDescription={seoDescription}
        ogUrl={canonicalUrl}
        ogType="article"
        ogImage={task.imageUrl}
      />

      <article className="pb-8 pt-4">
        <div className="mb-4 px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
        </div>

        <div className="space-y-4 px-4">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="brand">{getCategoryLabel(task.category)}</Badge>
              {task.urgent && <Badge variant="urgent">{t('tasks.urgent')}</Badge>}
              <TaskStatusBadge status={task.rawStatus ?? task.status} />
              {isRefreshing && <span className="text-xs text-gray-400">{t('common.updating')}</span>}
              {user && !task.isOwner && (
                <ReportButton
                  target={{ taskId: task.id, label: t('moderation.targetTask') }}
                  className="ml-auto"
                />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="mt-2 text-2xl font-bold text-brand-700">{budgetLabel}</p>
          </header>

          <TaskLifecycleTimeline status={task.rawStatus ?? task.status} />

          <section aria-label={t('tasks.details')}>
            <Card className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p>{task.location}</p>
                  {(taskProximity.source !== 'none' || taskProximity.isNearby || taskProximity.label) && (
                    <div className="mt-1.5">
                      <TaskDistanceBadge proximity={taskProximity} />
                    </div>
                  )}
                </div>
              </div>
              {task.scheduledFor && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-brand-500" />
                  {task.scheduledFor}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Users className="h-4 w-4 text-brand-500" />
                {formatOffersCount(displayOfferCount)}
              </div>
              <div className="text-sm text-gray-500">
                {t('tasks.postedAt', { time: formatRelativeTime(task.postedAt) })}
              </div>
            </Card>
          </section>

          <section aria-label={t('tasks.description')}>
            <Card>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">{t('tasks.description')}</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {task.description}
              </p>
            </Card>
          </section>

          {(isAssigned || isInProgress) && task.assignedTasker && (
            <TaskAssignmentBanner
              task={task}
              chatHref={resolvedChatId ? `/messages/${resolvedChatId}` : undefined}
              showChatButton={Boolean(showChatCard && resolvedChatId)}
            />
          )}

          {isCancelled && <TaskCancelledPanel />}

          {isCancelled && task.assignedTasker && (
            <section aria-label={t('tasks.previousTasker')}>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">{t('tasks.previousTasker')}</h2>
              <TrustProfileCard
                title={t('tasks.wasAssigned')}
                user={task.assignedTasker}
                profilePath={getUserProfilePath(task.assignedTasker)}
                completedJobsCount={task.assignedTasker.completedJobsCount}
              />
            </section>
          )}

          <section aria-label={t('tasks.postedBy')}>
            <h2 className="mb-2 text-sm font-semibold text-gray-900">{t('tasks.postedBy')}</h2>
            <TrustProfileCard
              title={t('tasks.taskOwner')}
              user={task.poster}
              profilePath={getUserProfilePath(task.poster)}
              completedJobsCount={task.poster.completedJobsCount}
            />
          </section>

          {isCompleted && task.assignedTasker && (
            <section aria-label={t('tasks.assignedTasker')}>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">{t('tasks.assignedTasker')}</h2>
              <TrustProfileCard
                title={t('tasks.trustedTasker')}
                user={task.assignedTasker}
                profilePath={getUserProfilePath(task.assignedTasker)}
                completedJobsCount={task.assignedTasker.completedJobsCount}
              />
            </section>
          )}

          {!isAuthenticated && isOpen && (
            <section aria-label={t('tasks.getStarted')}>
              <Card className="space-y-3 border-brand-200 bg-brand-50 text-center">
                <h2 className="text-base font-bold text-gray-900">{t('tasks.interestedTitle')}</h2>
                <p className="text-sm text-gray-600">
                  {t('tasks.interestedDescription')}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button fullWidth onClick={() => navigate('/auth/login', { state: { from: loginRedirect } })}>
                    {t('tasks.signInToMakeOffer')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={() => navigate('/auth/signup', { state: { from: loginRedirect } })}
                  >
                    {t('auth.createAccount')}
                  </Button>
                </div>
              </Card>
            </section>
          )}

          {showChatCard && resolvedChatId && (
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('chat.taskChat')}</p>
                <p className="text-sm text-gray-500">
                  {isCompleted
                    ? t('tasks.viewConversation')
                    : t('tasks.coordinateDetails')}
                </p>
              </div>
              <Link to={`/messages/${resolvedChatId}`}>
                <Button size="sm" variant="secondary">
                  <MessageCircle className="h-4 w-4" />
                  {t('chat.openChat')}
                </Button>
              </Link>
            </Card>
          )}

          {(task.status === 'completed' || isCompleted) && user && (
            <TaskCompletedPanel task={task} user={user} />
          )}

          {user && task.isOwner && (isCompleted || isCancelled) && (
            <div className="space-y-3">
              <TaskReopenHint />
              <Button fullWidth variant="secondary" onClick={handleReopen} disabled={isUpdatingStatus}>
                <RotateCcw className="h-4 w-4" />
                {t('tasks.reopenTask')}
              </Button>
            </div>
          )}

          {actionError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          {user && !isCompleted && !isCancelled && task.isOwner && isOpen && (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-gray-900">{t('tasks.offersTitle', { count: pendingOffers.length })}</h2>
              {pendingOffers.length === 0 ? (
                <EmptyState
                  icon={<Handshake className="h-6 w-6" />}
                  title={t('tasks.noOffersYet')}
                  description={t('tasks.noOffersHint')}
                />
              ) : (
                <OfferComparisonList
                  offers={pendingOffers}
                  taskBudget={task.budget}
                  currency={task.currency}
                  acceptingId={acceptingId}
                  onRequestAccept={handleRequestAccept}
                />
              )}
            </section>
          )}

          {user && !isCompleted && !isCancelled && task.isOwner && (isAssigned || isInProgress) && (
            <Button
              fullWidth
              variant="outline"
              onClick={handleCancelAssignment}
              disabled={isUpdatingStatus}
            >
              <XCircle className="h-4 w-4" />
              {t('tasks.cancelAssignment')}
            </Button>
          )}

          {user && !isCompleted && !isCancelled && task.isOwner && isInProgress && (
            <Button fullWidth onClick={handleComplete} disabled={isUpdatingStatus}>
              <CheckCircle2 className="h-4 w-4" />
              {t('tasks.markCompleted')}
            </Button>
          )}

          {user && !isCompleted && !isCancelled && task.isAssignedTasker && isAssigned && (
            <Button fullWidth onClick={handleStart} disabled={isUpdatingStatus}>
              <Play className="h-4 w-4" />
              {t('tasks.markAsStarted')}
            </Button>
          )}

          {user && !isCompleted && !isCancelled && (offerSubmitted || myPendingOffer) && !task.isOwner && (
            <div className="space-y-3">
              <Card className="flex items-center gap-3 border-brand-200 bg-brand-50">
                <CheckCircle className="h-5 w-5 shrink-0 text-brand-600" />
                <p className="text-sm font-medium text-brand-800">{t('tasks.offerSubmitted')}</p>
              </Card>
              {myPendingOffer && (
                <section className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">{t('offers.yourOffer')}</h2>
                  <OfferCard offer={myPendingOffer} currency={task.currency} />
                </section>
              )}
            </div>
          )}

          {user && !isCompleted && !isCancelled && canOffer && (
            <CreateOfferForm
              taskBudget={task.budget}
              taskCurrency={task.currency}
              onSubmit={handleCreateOffer}
            />
          )}

          {!isCompleted && !isCancelled && !hasKnownStatus && (
            <Card className="text-sm text-gray-600">
              <p className="font-semibold text-gray-900">{t('tasks.statusUnavailable')}</p>
              <p className="mt-1">
                {t('tasks.statusUnavailableHint', { status: task.rawStatus ?? task.status })}
              </p>
            </Card>
          )}
        </div>
      </article>

      <AcceptOfferDialog
        open={Boolean(acceptDialogOffer)}
        offer={acceptDialogOffer}
        taskTitle={task?.title ?? ''}
        currency={task?.currency}
        isAccepting={Boolean(acceptingId)}
        onConfirm={() => acceptDialogOffer && void handleAcceptOffer(acceptDialogOffer.id)}
        onCancel={() => setAcceptDialogOffer(null)}
      />
    </>
  )
}

export { PublicTaskPage as TaskDetailPage }
