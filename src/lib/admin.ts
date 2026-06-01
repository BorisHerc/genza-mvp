import type {
  AdminTaskRecord,
  AdminUserRecord,
  ModerationReport,
  ReportChatMessage,
  ReportStatus,
} from '../types/admin'
import type { MessageRow, ReportRow, TaskRow } from '../types/database'
import { resolveTaskCurrency } from './currency'
import { getSupabaseErrorMessage } from './errors'
import { translate } from './i18n'
import { fetchProfiles } from './profiles'
import { supabase } from './supabase'
import { getCategoryLabel, formatBudget } from './utils'

function logAdminAction(action: string, payload: Record<string, unknown>, result: { success: boolean; error?: string }) {
  console.debug('[Genza] admin action result', {
    action,
    ...payload,
    success: result.success,
    error: result.error ?? null,
  })
}

export async function listAdminUsers(): Promise<{ users: AdminUserRecord[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_users')

  if (error) {
    return { users: [], error: getSupabaseErrorMessage(error) }
  }

  const users = ((data ?? []) as Array<{
    id: string
    email: string | null
    full_name: string | null
    role: string | null
    location: string | null
    created_at: string
    verified: boolean | null
    suspended_at: string | null
    completed_jobs_count: number | string | null
    average_rating: number | string | null
    reviews_count: number | string | null
  }>).map((row) => ({
    id: row.id,
    email: row.email ?? undefined,
    fullName: row.full_name?.trim() || translate('common.memberFallback'),
    role: row.role,
    location: row.location,
    joinedAt: row.created_at,
    verified: Boolean(row.verified ?? true),
    suspended: Boolean(row.suspended_at),
    completedJobs: Number(row.completed_jobs_count ?? 0),
    averageRating: Number(row.average_rating ?? 0),
    reviewCount: Number(row.reviews_count ?? 0),
  }))

  return { users, error: undefined }
}

export async function listAdminTasks(): Promise<{ tasks: AdminTaskRecord[]; error?: string }> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return { tasks: [], error: getSupabaseErrorMessage(error) }
  }

  const rows = (data ?? []) as TaskRow[]
  const ownerIds = [...new Set(rows.map((row) => row.user_id))]
  const { profiles } = await fetchProfiles(ownerIds)
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  const tasks = rows.map((row) => {
    const owner = profileMap.get(row.user_id)
    return {
      id: String(row.id),
      title: row.title,
      location: row.location,
      category: row.category,
      status: row.status,
      budget: Number(row.budget),
      budgetType: row.budget_type === 'hourly' ? 'hourly' : 'fixed',
      currency: resolveTaskCurrency(row.currency, row.location),
      ownerName: owner?.full_name?.trim() || translate('common.memberFallback'),
      ownerId: row.user_id,
      createdAt: row.created_at,
      isHidden: Boolean(row.is_hidden),
    } satisfies AdminTaskRecord
  })

  return { tasks, error: undefined }
}

async function enrichReports(rows: ReportRow[]): Promise<ModerationReport[]> {
  if (!rows.length) return []

  const userIds = [
    ...new Set(
      rows.flatMap((row) => [row.reporter_id, row.reported_user_id].filter(Boolean) as string[]),
    ),
  ]
  const taskIds = [...new Set(rows.map((row) => row.task_id).filter(Boolean) as Array<number | string>)]

  const [{ profiles }, tasksResult] = await Promise.all([
    fetchProfiles(userIds),
    taskIds.length
      ? supabase.from('tasks').select('id, title').in('id', taskIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
  const taskMap = new Map(
    ((tasksResult.data ?? []) as Array<{ id: number | string; title: string }>).map((task) => [
      String(task.id),
      task.title,
    ]),
  )

  return rows.map((row) => ({
    id: String(row.id),
    reporterId: row.reporter_id,
    reporterName: profileMap.get(row.reporter_id)?.full_name?.trim() || 'Reporter',
    reportedUserId: row.reported_user_id ?? undefined,
    reportedUserName: row.reported_user_id
      ? profileMap.get(row.reported_user_id)?.full_name?.trim() || 'User'
      : undefined,
    taskId: row.task_id != null ? String(row.task_id) : undefined,
    taskTitle: row.task_id != null ? taskMap.get(String(row.task_id)) : undefined,
    chatId: row.chat_id != null ? String(row.chat_id) : undefined,
    messageId: row.message_id ?? undefined,
    reason: row.reason,
    details: row.details ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  }))
}

export async function listAdminReports(): Promise<{ reports: ModerationReport[]; error?: string }> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return { reports: [], error: getSupabaseErrorMessage(error) }
  }

  const reports = await enrichReports((data ?? []) as ReportRow[])
  return { reports, error: undefined }
}

export async function getReportChatMessages(chatId: string): Promise<{ messages: ReportChatMessage[]; error?: string }> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    return { messages: [], error: getSupabaseErrorMessage(error) }
  }

  const rows = (data ?? []) as MessageRow[]
  const senderIds = [...new Set(rows.map((row) => row.sender_id))]
  const { profiles } = await fetchProfiles(senderIds)
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  const messages = rows.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    senderName: profileMap.get(row.sender_id)?.full_name?.trim() || translate('common.memberFallback'),
    message: row.message,
    createdAt: row.created_at,
  }))

  return { messages, error: undefined }
}

export async function setUserSuspended(userId: string, suspend: boolean) {
  const payload = { suspended_at: suspend ? new Date().toISOString() : null }

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId)

  const result = error
    ? { success: false, error: getSupabaseErrorMessage(error) }
    : { success: true, error: undefined }

  logAdminAction('setUserSuspended', { userId, suspend }, result)
  return result
}

export async function setTaskHidden(taskId: string, hidden: boolean) {
  const { error } = await supabase
    .from('tasks')
    .update({ is_hidden: hidden })
    .eq('id', Number(taskId))

  const result = error
    ? { success: false, error: getSupabaseErrorMessage(error) }
    : { success: true, error: undefined }

  logAdminAction('setTaskHidden', { taskId, hidden }, result)
  return result
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', Number(reportId))

  const result = error
    ? { success: false, error: getSupabaseErrorMessage(error) }
    : { success: true, error: undefined }

  logAdminAction('updateReportStatus', { reportId, status }, result)
  return result
}

export function formatAdminTaskBudget(task: AdminTaskRecord) {
  return formatBudget(task.budget, task.budgetType as 'fixed' | 'hourly', task.currency)
}

export function formatAdminTaskCategory(category: string | null) {
  if (!category) return 'Other'
  return getCategoryLabel(category as import('../types').TaskCategory)
}
