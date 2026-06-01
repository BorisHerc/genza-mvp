import type { Task, TaskCategory } from '../types'
import type { ProfileRow, TaskRow } from '../types/database'
import { profileToUser } from '../types/database'
import { getActiveCurrency, resolveTaskCurrency } from './currency'
import { getSupabaseErrorMessage } from './errors'
import { translate } from './i18n'
import { parseNumericTaskId, sameUserId } from './ids'
import { fetchProfiles, getProfileStats } from './profiles'
import { supabase } from './supabase'
import { notifyMatchingTaskers } from './task-notifications'
import { getCategoryLabel } from './utils'
import { isTaskCompleted, normalizeTaskStatus } from './task-status'

function normalizeCategory(value: string | null | undefined): TaskCategory {
  const categories: TaskCategory[] = [
    'cleaning', 'moving', 'handyman', 'delivery', 'assembly', 'gardening', 'pet_care', 'other',
  ]
  return categories.includes(value as TaskCategory) ? (value as TaskCategory) : 'other'
}

function formatScheduledLabel(isoDate: string | null | undefined) {
  if (!isoDate) return undefined
  return new Date(isoDate).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function mapTaskRow(
  row: TaskRow,
  poster?: ProfileRow | null,
  assignedTasker?: ProfileRow | null,
  currentUserId?: string,
  chatId?: string,
): Task {
  const images = row.images ?? []
  return {
    id: String(row.id),
    userId: row.user_id,
    title: row.title,
    description: row.description,
    category: normalizeCategory(row.category),
    budget: Number(row.budget),
    budgetType: row.budget_type === 'hourly' ? 'hourly' : 'fixed',
    currency: resolveTaskCurrency(row.currency, row.location),
    location: row.location,
    postedAt: row.created_at,
    scheduledFor: formatScheduledLabel(row.scheduled_date),
    status: normalizeTaskStatus(row.status),
    rawStatus: row.status != null ? String(row.status) : undefined,
    offerCount: row.offer_count ?? 0,
    poster: profileToUser(poster, row.user_id),
    assignedTasker: assignedTasker ? profileToUser(assignedTasker, assignedTasker.id) : undefined,
    acceptedOfferId: row.accepted_offer_id != null ? String(row.accepted_offer_id) : undefined,
    assignedTaskerId: row.assigned_tasker_id ?? undefined,
    chatId: chatId != null ? String(chatId) : undefined,
    urgent: Boolean(row.urgent),
    imageUrl: images[0],
    imageUrls: images,
    isOwner: sameUserId(currentUserId, row.user_id),
    isAssignedTasker: sameUserId(currentUserId, row.assigned_tasker_id),
  }
}

export async function enrichTasks(rows: TaskRow[], currentUserId?: string) {
  const profileIds = [
    ...new Set(
      rows.flatMap((row) => [row.user_id, row.assigned_tasker_id].filter(Boolean) as string[]),
    ),
  ]
  const { profiles } = await fetchProfiles(profileIds)
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const taskIds = rows.map((r) => r.id)
  const { data: chats } = await supabase
    .from('chats')
    .select('id, task_id')
    .in('task_id', taskIds)

  const chatMap = new Map((chats ?? []).map((c) => [c.task_id, c.id]))

  return rows.map((row) =>
    mapTaskRow(
      row,
      profileMap.get(row.user_id),
      row.assigned_tasker_id ? profileMap.get(row.assigned_tasker_id) : null,
      currentUserId,
      chatMap.get(row.id),
    ),
  )
}

export async function listOpenTasks(currentUserId?: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('status', ['open', 'assigned', 'in_progress'])
    .order('created_at', { ascending: false })

  if (error) return { tasks: [] as Task[], error: getSupabaseErrorMessage(error) }
  return { tasks: await enrichTasks((data ?? []) as TaskRow[], currentUserId), error: undefined }
}

export async function listRecentlyCompletedPublicTasks(limit = 6, currentUserId?: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'completed')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { tasks: [] as Task[], error: getSupabaseErrorMessage(error) }
  return { tasks: await enrichTasks((data ?? []) as TaskRow[], currentUserId), error: undefined }
}

export async function listCompletedAssignedTasks(currentUserId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_tasker_id', currentUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Genza] listCompletedAssignedTasks failed', {
      userId: currentUserId,
      error: getSupabaseErrorMessage(error),
    })
    return { tasks: [] as Task[], error: getSupabaseErrorMessage(error) }
  }

  const rows = ((data ?? []) as TaskRow[]).filter((row) => isTaskCompleted(row.status))
  const tasks = await enrichTasks(rows, currentUserId)

  console.log('[Genza] listCompletedAssignedTasks', {
    userId: currentUserId,
    fetchedCount: (data ?? []).length,
    completedCount: tasks.length,
  })

  return { tasks, error: undefined }
}

export async function listCompletedOwnedTasks(currentUserId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Genza] listCompletedOwnedTasks failed', {
      userId: currentUserId,
      error: getSupabaseErrorMessage(error),
    })
    return { tasks: [] as Task[], error: getSupabaseErrorMessage(error) }
  }

  const rows = ((data ?? []) as TaskRow[]).filter((row) => isTaskCompleted(row.status))
  const tasks = await enrichTasks(rows, currentUserId)

  console.log('[Genza] listCompletedOwnedTasks', {
    userId: currentUserId,
    fetchedCount: (data ?? []).length,
    completedCount: tasks.length,
  })

  return { tasks, error: undefined }
}

export async function getTaskById(taskId: string, currentUserId?: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle()

  if (error) return { task: null as Task | null, error: getSupabaseErrorMessage(error) }
  if (!data) return { task: null, error: translate('tasks.notFound') }

  const row = data as TaskRow

  if (import.meta.env.DEV) {
    console.debug('[Genza] getTaskById raw status', {
      taskId,
      status: row.status,
      statusType: typeof row.status,
      normalized: normalizeTaskStatus(row.status),
    })
  }

  const numericTaskId = parseNumericTaskId(taskId)
  if (numericTaskId === null) {
    return { task: null, error: translate('tasks.notFound') }
  }

  const profileIds = [row.user_id, row.assigned_tasker_id].filter(Boolean) as string[]
  const { profiles } = await fetchProfiles(profileIds)
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const { data: chat } = await supabase
    .from('chats')
    .select('id')
    .eq('task_id', numericTaskId)
    .maybeSingle()

  return {
    task: mapTaskRow(
      row,
      profileMap.get(row.user_id),
      row.assigned_tasker_id ? profileMap.get(row.assigned_tasker_id) : null,
      currentUserId,
      chat?.id,
    ),
    error: undefined,
  }
}

async function applyTrustStats(
  task: Task,
  posterProfile?: ProfileRow | null,
  taskerProfile?: ProfileRow | null,
): Promise<Task> {
  const [posterStats, taskerStats] = await Promise.all([
    getProfileStats(task.userId),
    task.assignedTaskerId ? getProfileStats(task.assignedTaskerId) : Promise.resolve(null),
  ])

  return {
    ...task,
    poster: {
      ...task.poster,
      rating: posterStats.averageRating > 0 ? posterStats.averageRating : task.poster.rating,
      reviewCount: posterStats.reviewsCount,
      verified: Boolean(posterProfile?.verified ?? task.poster.verified),
      completedJobsCount: posterStats.completedJobsCount,
      username: posterProfile?.username ?? task.poster.username,
    },
    assignedTasker:
      task.assignedTasker && taskerStats
        ? {
            ...task.assignedTasker,
            rating:
              taskerStats.averageRating > 0
                ? taskerStats.averageRating
                : task.assignedTasker.rating,
            reviewCount: taskerStats.reviewsCount,
            verified: Boolean(taskerProfile?.verified ?? task.assignedTasker.verified),
            completedJobsCount: taskerStats.completedJobsCount,
            username: taskerProfile?.username ?? task.assignedTasker.username,
          }
        : task.assignedTasker,
  }
}

export async function getPublicTaskById(taskId: string, currentUserId?: string) {
  console.log('[Genza] public task fetch', { taskId, currentUserId: currentUserId ?? null })

  const result = await getTaskById(taskId, currentUserId)
  if (!result.task) return result

  const profileIds = [result.task.userId, result.task.assignedTaskerId].filter(Boolean) as string[]
  const { profiles } = await fetchProfiles(profileIds)
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  const task = await applyTrustStats(
    result.task,
    profileMap.get(result.task.userId),
    result.task.assignedTaskerId ? profileMap.get(result.task.assignedTaskerId) : null,
  )

  console.log('[Genza] public task fetch complete', {
    taskId,
    status: task.status,
    offerCount: task.offerCount,
  })

  return { task, error: undefined }
}

export const listPublicBrowsableTasks = listOpenTasks

export interface CreateTaskInput {
  title: string
  description: string
  category: TaskCategory
  budget: number
  budgetType: 'fixed' | 'hourly'
  currency?: import('./currency').SupportedCurrency
  location: string
  scheduledDate?: string
  urgent: boolean
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      budget: input.budget,
      budget_type: input.budgetType,
      currency: input.currency ?? getActiveCurrency(),
      location: input.location.trim(),
      scheduled_date: input.scheduledDate || null,
      urgent: input.urgent,
      status: 'open',
      offer_count: 0,
      images: [],
    })
    .select('id')
    .single()

  if (error) return { taskId: undefined, error: getSupabaseErrorMessage(error) }

  const taskId = String(data.id)

  void notifyMatchingTaskers({
    taskId,
    taskTitle: input.title.trim(),
    taskCategory: input.category,
    taskLocation: input.location.trim(),
    ownerUserId: userId,
  })

  return { taskId, error: undefined }
}

export async function updateTaskStatus(
  taskIdRaw: string,
  status: Task['status'],
  extra: Partial<TaskRow> = {},
) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) {
    return { success: false, error: translate('api.invalidTaskId') }
  }

  const { error } = await supabase
    .from('tasks')
    .update({ status, ...extra })
    .eq('id', taskId)

  if (import.meta.env.DEV) {
    console.debug('[Genza] updateTaskStatus', { taskId, status, extra, error: error?.message ?? null })
  }

  if (error) return { success: false, error: getSupabaseErrorMessage(error) }
  return { success: true, error: undefined }
}

export function getCategoryDisplay(category: TaskCategory) {
  return getCategoryLabel(category)
}
