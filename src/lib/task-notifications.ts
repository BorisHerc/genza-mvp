import type { TaskCategory } from '../types'
import { getTaskProximity } from './distance'
import { translate } from './i18n'
import { sameUserId } from './ids'
import { createNotification } from './notifications'
import { supabase } from './supabase'

/** Users seen within this window receive nearby task alerts. */
export const ACTIVE_USER_WINDOW_DAYS = 30

export interface NearbyTaskNotificationInput {
  taskId: string
  taskTitle: string
  taskCategory: TaskCategory
  taskLocation: string
  ownerUserId: string
}

function isRecentlyActive(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false
  const ageMs = Date.now() - new Date(lastSeenAt).getTime()
  return ageMs <= ACTIVE_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

function taskerMatchesLocation(
  taskLocation: string,
  taskerLocation: string | null | undefined,
): boolean {
  if (!taskerLocation?.trim()) return false

  const proximity = getTaskProximity(taskLocation, {
    profileLocation: taskerLocation,
    viewerLocation: taskerLocation,
  })

  return proximity.isNearby
}

/**
 * Notify taskers whose service categories and location match a newly posted task.
 * Runs best-effort after task creation — failures are logged but do not block posting.
 */
export async function notifyMatchingTaskers(input: NearbyTaskNotificationInput) {
  const cutoff = new Date(Date.now() - ACTIVE_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, location, service_categories, suspended_at, last_seen_at')
    .contains('service_categories', [input.taskCategory])
    .is('suspended_at', null)
    .gte('last_seen_at', cutoff)

  if (error) {
    console.warn('[Genza] notifyMatchingTaskers query failed', error.message)
    return { notified: 0, error: error.message }
  }

  const candidates = (data ?? []).filter(
    (row) =>
      !sameUserId(row.id, input.ownerUserId) &&
      isRecentlyActive(row.last_seen_at) &&
      taskerMatchesLocation(input.taskLocation, row.location),
  )

  if (!candidates.length) {
    return { notified: 0, error: undefined }
  }

  const title = translate('notifications.nearbyTaskTitle')
  const body = translate('notifications.nearbyTaskBodyWithTask', { task: input.taskTitle })

  const results = await Promise.all(
    candidates.map((tasker) =>
      createNotification({
        userId: tasker.id,
        type: 'nearby_task',
        title,
        body,
        taskId: input.taskId,
        logContext: 'nearby_task notification',
      }),
    ),
  )

  const notified = results.filter((result) => result.success).length

  if (import.meta.env.DEV) {
    console.debug('[Genza] notifyMatchingTaskers', {
      taskId: input.taskId,
      category: input.taskCategory,
      candidates: candidates.length,
      notified,
    })
  }

  return { notified, error: undefined }
}
