import type { TaskCategory } from '../types'
import {
  DEFAULT_SEARCH_RADIUS_KM,
  getTaskProximity,
  haversineDistanceKm,
  type ProximityOptions,
} from './distance'
import { translate } from './i18n'
import { sameUserId } from './ids'
import { createNotification } from './notifications'
import { buildProfileLocationLabel, profileCoordinates } from './profile-location'
import { locationsShareCity, resolveLocationCoordinates, type Coordinates } from './place-coordinates'
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

interface TaskerCandidate {
  id: string
  location: string | null
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
  service_categories: string[] | null
  suspended_at: string | null
  last_seen_at: string | null
  availability_enabled: boolean | null
  notification_email: string | null
}

function isRecentlyActive(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false
  const ageMs = Date.now() - new Date(lastSeenAt).getTime()
  return ageMs <= ACTIVE_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function neighborhoodsMatch(taskLocation: string, neighborhood?: string | null): boolean {
  if (!neighborhood?.trim()) return false
  return normalizeToken(taskLocation).includes(normalizeToken(neighborhood))
}

function taskerMatchesLocation(
  taskLocation: string,
  taskCoords: Coordinates | null,
  profile: Pick<TaskerCandidate, 'location' | 'neighborhood' | 'latitude' | 'longitude'>,
): boolean {
  const taskerCoords =
    profileCoordinates(profile.latitude, profile.longitude) ??
    resolveLocationCoordinates(profile.location)

  const resolvedTaskCoords = taskCoords ?? resolveLocationCoordinates(taskLocation)

  if (taskerCoords && resolvedTaskCoords) {
    const distanceKm = haversineDistanceKm(taskerCoords, resolvedTaskCoords)
    if (distanceKm <= DEFAULT_SEARCH_RADIUS_KM) return true
  }

  const viewerLocation = buildProfileLocationLabel(profile.location, profile.neighborhood)
  const proximityOptions: ProximityOptions = {
    profileCoords: taskerCoords,
    profileLocation: viewerLocation,
    viewerLocation,
  }

  if (locationsShareCity(taskLocation, profile.location)) return true
  if (neighborhoodsMatch(taskLocation, profile.neighborhood)) return true

  return getTaskProximity(taskLocation, proximityOptions).isNearby
}

/**
 * Notify taskers whose service categories and location match a newly posted task.
 * Runs best-effort after task creation — failures are logged but do not block posting.
 */
export async function notifyMatchingTaskers(input: NearbyTaskNotificationInput) {
  const cutoff = new Date(Date.now() - ACTIVE_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const taskCoords = resolveLocationCoordinates(input.taskLocation)

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, location, neighborhood, latitude, longitude, service_categories, suspended_at, last_seen_at, availability_enabled, notification_email',
    )
    .contains('service_categories', [input.taskCategory])
    .is('suspended_at', null)
    .eq('availability_enabled', true)
    .gte('last_seen_at', cutoff)

  if (error) {
    console.warn('[Genza] notifyMatchingTaskers query failed', error.message)
    return { notified: 0, matched: 0, queried: 0, error: error.message }
  }

  const rows = (data ?? []) as TaskerCandidate[]

  const candidates = rows.filter(
    (row) =>
      !sameUserId(row.id, input.ownerUserId) &&
      isRecentlyActive(row.last_seen_at) &&
      taskerMatchesLocation(input.taskLocation, taskCoords, row),
  )

  console.log('[Genza] notifyMatchingTaskers', {
    taskId: input.taskId,
    category: input.taskCategory,
    taskLocation: input.taskLocation,
    queried: rows.length,
    matched: candidates.length,
    taskCoords: taskCoords ? `${taskCoords.lat},${taskCoords.lng}` : null,
  })

  if (!candidates.length) {
    return { notified: 0, matched: 0, queried: rows.length, error: undefined }
  }

  const title = translate('notifications.nearbyTaskTitle')
  const body = translate('notifications.nearbyTaskBodyWithTask', { task: input.taskTitle })

  const results = await Promise.all(
    candidates.map(async (tasker) => {
      const notification = await createNotification({
        userId: tasker.id,
        type: 'nearby_task',
        title,
        body,
        taskId: input.taskId,
        logContext: 'nearby_task notification',
      })

      return notification
    }),
  )

  const notified = results.filter((result) => result.success).length

  console.log('[Genza] notifyMatchingTaskers complete', {
    taskId: input.taskId,
    notified,
    matched: candidates.length,
  })

  return { notified, matched: candidates.length, queried: rows.length, error: undefined }
}
