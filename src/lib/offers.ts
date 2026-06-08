import type { Offer, OfferStatus } from '../types/marketplace'
import type { OfferRow, ProfileRow } from '../types/database'
import { getSupabaseErrorMessage, getSupabaseStepError } from './errors'
import { translate } from './i18n'
import { assertOfferInsertPayload, logOfferPayloadDebug, parseNumericTaskId, sameUserId } from './ids'
import { getTaskProximity } from './distance'
import { getPriceDelta, getResponseMinutes } from './offer-sort'
import { createNotification, notifyTaskMarkedComplete } from './notifications'
import { fetchProfiles, getProfileStats } from './profiles'
import { supabase } from './supabase'
import { getTaskById, updateTaskStatus } from './tasks'

async function getAuthenticatedUserId(fallbackUserId: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? fallbackUserId
}

function normalizeOfferStatus(status: string | null | undefined): OfferStatus {
  const value = (status ?? 'pending').toLowerCase()
  if (value === 'accepted' || value === 'rejected' || value === 'withdrawn' || value === 'pending') {
    return value
  }
  return 'pending'
}

function mapOffer(
  row: OfferRow,
  tasker?: ProfileRow | null,
  stats?: { averageRating: number; reviewsCount: number; completedJobsCount: number },
  context?: OfferListContext,
): Offer {
  const offer: Offer = {
    id: String(row.id),
    taskId: String(row.task_id),
    taskerId: row.tasker_id,
    taskerName: tasker?.full_name?.trim() || translate('common.memberFallback'),
    taskerAvatarUrl: tasker?.avatar_url ?? undefined,
    taskerUsername: tasker?.username ?? null,
    taskerLocation: tasker?.location ?? null,
    taskerRating: stats && stats.averageRating > 0 ? stats.averageRating : 5,
    taskerReviewCount: stats?.reviewsCount ?? 0,
    taskerCompletedJobs: stats?.completedJobsCount ?? 0,
    taskerVerified: Boolean(tasker?.verified ?? true),
    message: row.message,
    price: Number(row.price),
    status: normalizeOfferStatus(row.status),
    createdAt: row.created_at,
  }

  if (context?.taskLocation && tasker?.location) {
    offer.proximity = getTaskProximity(context.taskLocation, {
      profileLocation: tasker.location,
      viewerLocation: context.taskLocation,
    })
  }

  if (context?.taskPostedAt) {
    offer.responseMinutes = getResponseMinutes(row.created_at, context.taskPostedAt)
  }

  if (context?.taskBudget != null) {
    offer.priceDelta = getPriceDelta(Number(row.price), context.taskBudget)
  }

  return offer
}

export interface OfferListContext {
  taskLocation?: string
  taskPostedAt?: string
  taskBudget?: number
}

async function enrichOffers(rows: OfferRow[], context?: OfferListContext): Promise<Offer[]> {
  if (!rows.length) return []

  const taskerIds = [...new Set(rows.map((row) => row.tasker_id))]
  const { profiles } = await fetchProfiles(taskerIds)
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  const statsEntries = await Promise.all(
    taskerIds.map(async (taskerId) => [taskerId, await getProfileStats(taskerId)] as const),
  )
  const statsMap = new Map(statsEntries)

  return rows.map((row) =>
    mapOffer(row, profileMap.get(row.tasker_id), statsMap.get(row.tasker_id), context),
  )
}

export async function listOffersForTask(taskIdRaw: string, context?: OfferListContext) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) {
    return { offers: [] as Offer[], error: translate('api.invalidTaskId') }
  }

  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) return { offers: [] as Offer[], error: getSupabaseErrorMessage(error) }

  const rows = (data ?? []) as OfferRow[]

  return {
    offers: await enrichOffers(rows, context),
    error: undefined,
  }
}

export async function createOffer(
  taskerIdRaw: string,
  input: { taskId: string; message: string; price: number; estimatedDuration?: string },
) {
  const authUserId = await getAuthenticatedUserId(taskerIdRaw)
  const payload = assertOfferInsertPayload(input.taskId, authUserId)
  if (!payload.ok) {
    return { offer: null as Offer | null, error: payload.error }
  }

  const { taskId, taskerId } = payload

  console.log('[Genza] createOffer userId', {
    taskId,
    authUserId,
    requestedTaskerId: taskerIdRaw,
  })

  logOfferPayloadDebug({
    taskId,
    taskerIdPrefix: `${taskerId.slice(0, 8)}…`,
  })

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, user_id, title, status, offer_count')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { offer: null as Offer | null, error: getSupabaseErrorMessage(taskError) || translate('tasks.notFound') }
  }

  if (sameUserId(task.user_id, taskerId)) {
    return { offer: null, error: translate('api.cannotOfferOwnTask') }
  }

  if (task.status !== 'open') {
    return { offer: null, error: translate('api.taskNotAcceptingOffers') }
  }

  const { data: existing } = await supabase
    .from('offers')
    .select('id')
    .eq('task_id', taskId)
    .eq('tasker_id', taskerId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return { offer: null, error: translate('api.alreadyPendingOffer') }
  }

  const insertPayload = {
    task_id: taskId,
    tasker_id: taskerId,
    message: input.message.trim(),
    price: input.price,
    status: 'pending' as const,
  }

  const { data, error } = await supabase
    .from('offers')
    .insert(insertPayload)
    .select('*')
    .single()

  console.log('[Genza] createOffer insert result', {
    taskId,
    authUserId: taskerId,
    success: !error,
    offerId: data?.id ?? null,
    error: error ? getSupabaseErrorMessage(error) : null,
  })

  if (error) {
    const message = getSupabaseErrorMessage(error)
    if (message.includes('invalid input syntax for type bigint') && message.includes('-')) {
      return {
        offer: null,
        error: translate('api.offerDbMigration'),
      }
    }
    return { offer: null, error: message }
  }

  await supabase
    .from('tasks')
    .update({ offer_count: (task.offer_count ?? 0) + 1 })
    .eq('id', taskId)

  const { profiles } = await fetchProfiles([taskerId])
  const offer = mapOffer(data as OfferRow, profiles[0], await getProfileStats(taskerId))

  const recipientUserId = task.user_id

  await createNotification({
    userId: recipientUserId,
    type: 'new_offer',
    title: translate('notifications.newOfferTitle'),
    body: translate('notifications.newOfferBodyWithTask', { task: task.title }),
    taskId: String(taskId),
    offerId: offer.id,
    actorUserId: taskerId,
    logContext: 'new_offer notification',
  })

  return { offer, recipientUserId, error: undefined }
}

export async function acceptOffer(taskOwnerId: string, taskIdRaw: string, offerIdRaw: string) {
  const taskId = parseNumericTaskId(taskIdRaw)
  const offerId = parseNumericTaskId(offerIdRaw)

  if (taskId === null) {
    return { chatId: undefined, error: translate('api.invalidTaskId') }
  }
  if (offerId === null) {
    return { chatId: undefined, error: translate('api.invalidOfferId') }
  }

  const { task, error: taskError } = await getTaskById(String(taskId), taskOwnerId)
  if (taskError || !task) {
    return { chatId: undefined, error: taskError || translate('tasks.notFound') }
  }
  if (!task.isOwner) {
    return { chatId: undefined, error: translate('api.onlyOwnerAcceptOffers') }
  }
  if (task.status !== 'open') {
    return { chatId: undefined, error: translate('api.taskAlreadyAccepted') }
  }

  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .eq('task_id', taskId)
    .single()

  if (offerError || !offer) {
    return {
      chatId: undefined,
      error: getSupabaseStepError(translate('api.steps.loadOffer'), offerError ?? { message: translate('api.offerNotFound') }),
    }
  }

  const { error: acceptError } = await supabase
    .from('offers')
    .update({ status: 'accepted' })
    .eq('id', offerId)

  if (acceptError) {
    return { chatId: undefined, error: getSupabaseStepError(translate('api.steps.markOfferAccepted'), acceptError) }
  }

  const { error: rejectError } = await supabase
    .from('offers')
    .update({ status: 'rejected' })
    .eq('task_id', taskId)
    .neq('id', offerId)
    .eq('status', 'pending')

  if (rejectError) {
    return { chatId: undefined, error: getSupabaseStepError(translate('api.steps.rejectOtherOffers'), rejectError) }
  }

  const taskUpdate = await updateTaskStatus(String(taskId), 'assigned', {
    accepted_offer_id: offerId,
    assigned_tasker_id: offer.tasker_id,
  })

  if (!taskUpdate.success) {
    return {
      chatId: undefined,
      error: getSupabaseStepError(translate('api.steps.updateTaskAssignment'), { message: taskUpdate.error }),
    }
  }

  const { data: existingChat, error: chatLookupError } = await supabase
    .from('chats')
    .select('id')
    .eq('task_id', taskId)
    .maybeSingle()

  if (chatLookupError) {
    return { chatId: undefined, error: getSupabaseStepError(translate('api.steps.loadTaskChat'), chatLookupError) }
  }

  let chatId = existingChat?.id != null ? String(existingChat.id) : undefined

  if (!chatId) {
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        task_id: taskId,
        user_id: taskOwnerId,
        tasker_id: offer.tasker_id,
        offer_id: offerId,
      })
      .select('id')
      .single()

    if (chatError) {
      return { chatId: undefined, error: getSupabaseStepError(translate('api.steps.createTaskChat'), chatError) }
    }
    chatId = String(chat.id)
  }

  const notification = await createNotification({
    userId: offer.tasker_id,
    type: 'offer_accepted',
    title: translate('notifications.offerAcceptedTitle'),
    body: translate('notifications.offerAcceptedBodyWithTask', { task: task.title }),
    taskId: String(taskId),
    offerId: String(offerId),
    chatId,
    actorUserId: taskOwnerId,
    logContext: 'offer_accepted notification',
  })

  if (!notification.success && notification.error) {
    if (import.meta.env.DEV) {
      console.warn('[Genza] acceptOffer notification failed:', notification.error)
    }
  }

  return { chatId, error: undefined }
}

export async function startTaskProgress(taskIdRaw: string, userId: string) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) return { success: false, error: translate('api.invalidTaskId') }

  const { task, error } = await getTaskById(String(taskId), userId)
  if (error || !task) return { success: false, error: error || translate('tasks.notFound') }

  if (!task.isAssignedTasker || task.status !== 'assigned') {
    return { success: false, error: translate('api.onlyTaskerStart') }
  }

  return updateTaskStatus(String(taskId), 'in_progress')
}

export async function cancelAssignment(taskIdRaw: string, ownerId: string) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) return { success: false, error: translate('api.invalidTaskId') }

  const { task, error } = await getTaskById(String(taskId), ownerId)
  if (error || !task) return { success: false, error: error || translate('tasks.notFound') }
  if (!task.isOwner) return { success: false, error: translate('api.onlyOwnerCancel') }
  if (!['assigned', 'in_progress'].includes(task.status)) {
    return { success: false, error: translate('api.cannotCancelAssignment') }
  }

  const taskerId = task.assignedTaskerId

  if (task.acceptedOfferId) {
    await supabase
      .from('offers')
      .update({ status: 'withdrawn' })
      .eq('id', Number(task.acceptedOfferId))
  }

  const result = await updateTaskStatus(String(taskId), 'cancelled')

  if (result.success && taskerId) {
    await createNotification({
      userId: taskerId,
      type: 'offer_accepted',
      title: translate('notifications.assignmentCancelledTitle'),
      body: translate('notifications.assignmentCancelledBody', { task: task.title }),
      taskId: String(taskId),
      actorUserId: ownerId,
      logContext: 'assignment_cancelled notification',
    })
  }

  return result
}

export async function reopenTask(taskIdRaw: string, ownerId: string) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) return { success: false, error: translate('api.invalidTaskId') }

  const { task, error } = await getTaskById(String(taskId), ownerId)
  if (error || !task) return { success: false, error: error || translate('tasks.notFound') }
  if (!task.isOwner) return { success: false, error: translate('api.onlyOwnerReopen') }
  if (!['completed', 'cancelled'].includes(task.status)) {
    return { success: false, error: translate('api.onlyCompletedReopen') }
  }

  return updateTaskStatus(String(taskId), 'open', {
    assigned_tasker_id: null,
    accepted_offer_id: null,
  })
}

export async function completeTask(taskIdRaw: string, ownerId: string) {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) return { success: false, error: translate('api.invalidTaskId') }

  const { task, error } = await getTaskById(String(taskId), ownerId)
  if (error || !task) return { success: false, error: error || translate('tasks.notFound') }
  if (!task.isOwner) return { success: false, error: translate('api.onlyOwnerComplete') }
  if (!['assigned', 'in_progress'].includes(task.status)) {
    return { success: false, error: translate('api.cannotCompleteYet') }
  }

  const result = await updateTaskStatus(String(taskId), 'completed')

  if (result.success) {
    void notifyTaskMarkedComplete({
      taskId: String(taskId),
      taskTitle: task.title,
      ownerUserId: task.userId,
      taskerUserId: task.assignedTaskerId,
      completedByUserId: ownerId,
    })
  }

  if (import.meta.env.DEV) {
    console.debug('[Genza] completeTask', {
      taskId,
      previousStatus: task.status,
      rawStatus: task.rawStatus ?? null,
      updateSuccess: result.success,
      updateError: result.error ?? null,
    })
  }

  return result
}
