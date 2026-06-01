import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Flag,
  RefreshCw,
  Shield,
  UserX,
} from 'lucide-react'
import { PageMeta } from '../components/profile/PageMeta'
import { TaskStatusBadge } from '../components/tasks/TaskStatusBadge'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  formatAdminTaskBudget,
  formatAdminTaskCategory,
  getReportChatMessages,
  listAdminReports,
  listAdminTasks,
  listAdminUsers,
  setTaskHidden,
  setUserSuspended,
  updateReportStatus,
} from '../lib/admin'
import { formatJoinedDate, formatRating } from '../lib/profile-text'
import { formatRelativeTime } from '../lib/utils'
import { useTranslation } from '../context/LocaleContext'
import type { AdminTab, AdminTaskRecord, AdminUserRecord, ModerationReport } from '../types/admin'

function AdminTabs({ active, onChange }: { active: AdminTab; onChange: (tab: AdminTab) => void }) {
  const { t } = useTranslation()
  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'users', label: t('admin.tabs.users') },
    { id: 'tasks', label: t('admin.tabs.tasks') },
    { id: 'reports', label: t('admin.tabs.reports') },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
            active === tab.id
              ? 'bg-brand-600 text-white'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function AdminUsersPanel({
  users,
  actionId,
  onSuspendToggle,
}: {
  users: AdminUserRecord[]
  actionId: string | null
  onSuspendToggle: (userId: string, suspend: boolean) => void
}) {
  const { t } = useTranslation()

  if (!users.length) {
    return <Card className="text-center text-sm text-gray-500">{t('admin.noUsers')}</Card>
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Card key={user.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-gray-900">{user.fullName}</p>
              {user.email && <p className="truncate text-sm text-gray-500">{user.email}</p>}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {user.role && (
                <Badge variant={user.role === 'admin' ? 'info' : 'muted'} className="capitalize">
                  {user.role}
                </Badge>
              )}
              {user.suspended && <Badge variant="urgent">{t('admin.suspended')}</Badge>}
              {user.verified && <Badge variant="brand">{t('admin.verified')}</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldCity')}</p>
              <p>{user.location || '—'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldJoined')}</p>
              <p>{formatJoinedDate(user.joinedAt)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldJobs')}</p>
              <p>{user.completedJobs}</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldRating')}</p>
              <p>{formatRating(user.averageRating)} ({user.reviewCount})</p>
            </div>
          </div>

          {user.role !== 'admin' && (
            <Button
              fullWidth
              size="sm"
              variant={user.suspended ? 'secondary' : 'outline'}
              disabled={actionId === user.id}
              onClick={() => onSuspendToggle(user.id, !user.suspended)}
            >
              <UserX className="h-4 w-4" />
              {actionId === user.id
                ? t('admin.updating')
                : user.suspended
                  ? t('admin.unsuspendUser')
                  : t('admin.suspendUser')}
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}

function AdminTasksPanel({
  tasks,
  actionId,
  onHideToggle,
}: {
  tasks: AdminTaskRecord[]
  actionId: string | null
  onHideToggle: (taskId: string, hidden: boolean) => void
}) {
  const { t } = useTranslation()

  if (!tasks.length) {
    return <Card className="text-center text-sm text-gray-500">{t('admin.noTasks')}</Card>
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-gray-900">{task.title}</p>
              <p className="text-sm text-gray-500">{task.location}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <TaskStatusBadge status={task.status} />
              {task.isHidden && <Badge variant="urgent">{t('admin.hidden')}</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldCategory')}</p>
              <p>{formatAdminTaskCategory(task.category)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldBudget')}</p>
              <p>{formatAdminTaskBudget(task)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldOwner')}</p>
              <p className="truncate">{task.ownerName}</p>
            </div>
            <div>
              <p className="font-medium text-gray-400">{t('admin.fieldPosted')}</p>
              <p>{formatRelativeTime(task.createdAt)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to={`/tasks/${task.id}`} className="flex-1">
              <Button fullWidth size="sm" variant="secondary">
                <ExternalLink className="h-4 w-4" />
                {t('admin.viewTask')}
              </Button>
            </Link>
            <Button
              fullWidth
              size="sm"
              variant="outline"
              disabled={actionId === task.id}
              onClick={() => onHideToggle(task.id, !task.isHidden)}
            >
              {task.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {actionId === task.id ? t('admin.updating') : task.isHidden ? t('admin.unhide') : t('admin.hideTask')}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ReportChatContext({ chatId, highlightMessageId }: { chatId: string; highlightMessageId?: string }) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Array<{ id: string; senderName: string; message: string; createdAt: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const result = await getReportChatMessages(chatId)
      if (!cancelled) {
        setMessages(result.messages)
        setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [chatId])

  if (isLoading) return <p className="text-xs text-gray-500">{t('admin.loadingChatContext')}</p>
  if (!messages.length) return <p className="text-xs text-gray-500">{t('admin.noChatMessages')}</p>

  return (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={[
            'rounded-lg px-3 py-2 text-xs',
            message.id === highlightMessageId ? 'bg-red-50 ring-1 ring-red-200' : 'bg-white',
          ].join(' ')}
        >
          <p className="font-semibold text-gray-800">{message.senderName}</p>
          <p className="mt-0.5 text-gray-600">{message.message}</p>
          <p className="mt-1 text-[10px] text-gray-400">{formatRelativeTime(message.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}

function AdminReportsPanel({
  reports,
  actionId,
  onMarkReviewed,
  onDismiss,
}: {
  reports: ModerationReport[]
  actionId: string | null
  onMarkReviewed: (reportId: string) => void
  onDismiss: (reportId: string) => void
}) {
  const { t } = useTranslation()

  if (!reports.length) {
    return <Card className="text-center text-sm text-gray-500">{t('admin.noReports')}</Card>
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-gray-900 capitalize">{report.reason.replace(/_/g, ' ')}</p>
              <p className="text-xs text-gray-500">
                {t('admin.reportedBy', {
                  time: formatRelativeTime(report.createdAt),
                  name: report.reporterName,
                })}
              </p>
            </div>
            <Badge
              variant={
                report.status === 'open' ? 'warning' : report.status === 'reviewed' ? 'success' : 'muted'
              }
            >
              {t(
                report.status === 'open'
                  ? 'admin.statusLabels.open'
                  : report.status === 'reviewed'
                    ? 'admin.statusLabels.reviewed'
                    : 'admin.statusLabels.dismissed',
              )}
            </Badge>
          </div>

          {report.details && <p className="text-sm text-gray-600">{report.details}</p>}

          <div className="space-y-1 text-xs text-gray-600">
            {report.reportedUserName && (
              <p>
                <span className="font-medium text-gray-400">{t('admin.labelUser')}</span> {report.reportedUserName}
              </p>
            )}
            {report.taskTitle && (
              <p>
                <span className="font-medium text-gray-400">{t('admin.labelTask')}</span> {report.taskTitle}
              </p>
            )}
            {report.chatId && (
              <p>
                <span className="font-medium text-gray-400">{t('admin.labelChat')}</span> #{report.chatId}
              </p>
            )}
          </div>

          {report.chatId && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('admin.flaggedChat')}
              </p>
              <ReportChatContext chatId={report.chatId} highlightMessageId={report.messageId} />
            </div>
          )}

          {report.status === 'open' && (
            <div className="flex gap-2">
              <Button
                fullWidth
                size="sm"
                disabled={actionId === report.id}
                onClick={() => onMarkReviewed(report.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {actionId === report.id ? t('admin.saving') : t('admin.markReviewed')}
              </Button>
              <Button
                fullWidth
                size="sm"
                variant="outline"
                disabled={actionId === report.id}
                onClick={() => onDismiss(report.id)}
              >
                {t('admin.dismiss')}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

export function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [tasks, setTasks] = useState<AdminTaskRecord[]>([])
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setError('')

    const [usersResult, tasksResult, reportsResult] = await Promise.all([
      listAdminUsers(),
      listAdminTasks(),
      listAdminReports(),
    ])

    setUsers(usersResult.users)
    setTasks(tasksResult.tasks)
    setReports(reportsResult.reports)

    const combinedError = usersResult.error || tasksResult.error || reportsResult.error
    if (combinedError) setError(combinedError)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      await loadDashboard()
      if (!cancelled) setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [loadDashboard])

  const refresh = async () => {
    setIsRefreshing(true)
    await loadDashboard()
    setIsRefreshing(false)
  }

  const handleSuspendToggle = async (userId: string, suspend: boolean) => {
    setActionId(userId)
    const result = await setUserSuspended(userId, suspend)
    setActionId(null)
    if (!result.success) {
      toast.error(result.error ?? t('admin.updateUserFailed'))
      setError(result.error ?? t('admin.updateUserFailed'))
      return
    }
    toast.success(suspend ? t('admin.userSuspended') : t('admin.userUnsuspended'))
    setUsers((current) =>
      current.map((item) => (item.id === userId ? { ...item, suspended: suspend } : item)),
    )
  }

  const handleHideToggle = async (taskId: string, hidden: boolean) => {
    setActionId(taskId)
    const result = await setTaskHidden(taskId, hidden)
    setActionId(null)
    if (!result.success) {
      toast.error(result.error ?? t('admin.updateTaskFailed'))
      setError(result.error ?? t('admin.updateTaskFailed'))
      return
    }
    toast.success(hidden ? t('admin.taskHidden') : t('admin.taskVisible'))
    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, isHidden: hidden } : item)),
    )
  }

  const handleMarkReviewed = async (reportId: string) => {
    setActionId(reportId)
    const result = await updateReportStatus(reportId, 'reviewed')
    setActionId(null)
    if (!result.success) {
      toast.error(result.error ?? t('admin.updateReportFailed'))
      setError(result.error ?? t('admin.updateReportFailed'))
      return
    }
    toast.success(t('admin.reportReviewed'))
    setReports((current) =>
      current.map((item) => (item.id === reportId ? { ...item, status: 'reviewed' } : item)),
    )
  }

  const handleDismiss = async (reportId: string) => {
    setActionId(reportId)
    const result = await updateReportStatus(reportId, 'dismissed')
    setActionId(null)
    if (!result.success) {
      toast.error(result.error ?? t('admin.dismissFailed'))
      setError(result.error ?? t('admin.dismissFailed'))
      return
    }
    toast.success(t('admin.reportDismissed'))
    setReports((current) =>
      current.map((item) => (item.id === reportId ? { ...item, status: 'dismissed' } : item)),
    )
  }

  if (isLoading) {
    return <PageLoader label={t('admin.loading')} className="min-h-[60dvh]" />
  }

  const openReports = reports.filter((report) => report.status === 'open').length

  return (
    <>
      <PageMeta title={t('admin.metaTitle')} description={t('admin.metaDescription')} />

      <div className="px-4 pb-8 pt-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('admin.backToApp')}
        </button>

        <header className="mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <Shield className="h-3.5 w-3.5" />
                {t('admin.title')}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboardTitle')}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('admin.signedInAs', { name: user?.fullName || user?.email || '' })}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-gray-900">{users.length}</p>
            <p className="text-xs text-gray-500">{t('admin.tabs.users')}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-gray-900">{tasks.length}</p>
            <p className="text-xs text-gray-500">{t('admin.tabs.tasks')}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-lg font-bold text-gray-900">{openReports}</p>
            <p className="text-xs text-gray-500">{t('admin.openReportsLabel')}</p>
          </Card>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4">
          <AdminTabs active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'users' && (
          <AdminUsersPanel users={users} actionId={actionId} onSuspendToggle={handleSuspendToggle} />
        )}
        {activeTab === 'tasks' && (
          <AdminTasksPanel tasks={tasks} actionId={actionId} onHideToggle={handleHideToggle} />
        )}
        {activeTab === 'reports' && (
          <AdminReportsPanel
            reports={reports}
            actionId={actionId}
            onMarkReviewed={handleMarkReviewed}
            onDismiss={handleDismiss}
          />
        )}

        {activeTab === 'reports' && openReports > 0 && (
          <Card className="mt-4 flex items-start gap-3 border-amber-200 bg-amber-50">
            <Flag className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              {openReports === 1
                ? t('admin.openReportsWarningOne', { count: openReports })
                : t('admin.openReportsWarningMany', { count: openReports })}
            </p>
          </Card>
        )}
      </div>
    </>
  )
}
