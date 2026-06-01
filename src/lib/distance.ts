import { translate } from './i18n'
import { locationsShareCity, resolveLocationCoordinates, type Coordinates } from './place-coordinates'

export type { Coordinates }

/** Tasks within this radius show the "Nearby" badge. */
export const NEARBY_THRESHOLD_KM = 2

/** Default search radius for future map / radius filters. */
export const DEFAULT_SEARCH_RADIUS_KM = 25

const EARTH_RADIUS_KM = 6371
const FAR_FALLBACK_SORT_KM = 5000

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

/** Haversine great-circle distance in kilometres. */
export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistanceValue(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '0'
  if (km < 0.1) return '0.1'
  if (km < 10) return String(Math.round(km * 10) / 10)
  return String(Math.round(km))
}

export function isNearbyDistance(km: number): boolean {
  return km <= NEARBY_THRESHOLD_KM
}

export type DistanceLabelVariant = 'fromYou' | 'away'

export function formatDistanceLabel(km: number, variant: DistanceLabelVariant = 'fromYou'): string {
  const distance = formatDistanceValue(km)
  return variant === 'fromYou'
    ? translate('distance.fromYou', { distance })
    : translate('distance.away', { distance })
}

export type ProximitySource = 'gps' | 'profile' | 'city' | 'text' | 'none'

export interface TaskProximity {
  distanceKm: number | null
  label: string | undefined
  isNearby: boolean
  source: ProximitySource
}

export interface ProximityOptions {
  userCoords?: Coordinates | null
  profileLocation?: string | null
  viewerLocation?: string | null
}

function buildGpsProximity(distanceKm: number): TaskProximity {
  if (isNearbyDistance(distanceKm)) {
    return {
      distanceKm,
      label: translate('common.nearby'),
      isNearby: true,
      source: 'gps',
    }
  }

  return {
    distanceKm,
    label: formatDistanceLabel(distanceKm, 'fromYou'),
    isNearby: false,
    source: 'gps',
  }
}

function buildApproxProximity(
  distanceKm: number,
  source: Extract<ProximitySource, 'profile' | 'city'>,
): TaskProximity {
  if (isNearbyDistance(distanceKm)) {
    return {
      distanceKm,
      label: translate('common.nearby'),
      isNearby: true,
      source,
    }
  }

  return {
    distanceKm,
    label: formatDistanceLabel(distanceKm, 'away'),
    isNearby: false,
    source,
  }
}

/** Resolve viewer position: GPS first, then profile city coordinates. */
export function resolveViewerCoordinates(options: ProximityOptions): {
  coords: Coordinates | null
  source: ProximitySource
} {
  if (options.userCoords) {
    return { coords: options.userCoords, source: 'gps' }
  }

  const profileCoords = resolveLocationCoordinates(options.profileLocation)
  if (profileCoords) {
    return { coords: profileCoords, source: 'profile' }
  }

  return { coords: null, source: 'none' }
}

export function getTaskProximity(taskLocation: string, options: ProximityOptions): TaskProximity {
  const viewerLocation = options.viewerLocation ?? options.profileLocation
  const taskCoords = resolveLocationCoordinates(taskLocation)
  const viewer = resolveViewerCoordinates(options)

  if (viewer.source === 'gps' && viewer.coords && taskCoords) {
    return buildGpsProximity(haversineDistanceKm(viewer.coords, taskCoords))
  }

  if (viewer.coords && taskCoords) {
    const source = viewer.source === 'profile' ? 'profile' : 'city'
    return buildApproxProximity(haversineDistanceKm(viewer.coords, taskCoords), source)
  }

  if (locationsShareCity(viewerLocation, taskLocation)) {
    return {
      distanceKm: 0,
      label: translate('common.nearby'),
      isNearby: true,
      source: 'text',
    }
  }

  if (viewerLocation?.trim()) {
    return {
      distanceKm: null,
      label: translate('distance.far'),
      isNearby: false,
      source: 'text',
    }
  }

  return {
    distanceKm: null,
    label: undefined,
    isNearby: false,
    source: 'none',
  }
}

export function proximitySortKey(proximity: TaskProximity): number {
  if (proximity.distanceKm != null) return proximity.distanceKm
  if (proximity.isNearby) return 0
  if (proximity.source === 'text' && proximity.label) return FAR_FALLBACK_SORT_KM
  return Number.POSITIVE_INFINITY
}

export function enrichTasksWithProximity<T extends { location: string }>(
  tasks: T[],
  options: ProximityOptions,
): Array<T & TaskProximity> {
  return tasks.map((task) => ({
    ...task,
    ...getTaskProximity(task.location, options),
  }))
}

/** Nearby tasks first; unknown distance keeps original relative order via stable sort. */
export function sortTasksByProximity<T extends { location: string }>(
  tasks: T[],
  options: ProximityOptions,
): Array<T & TaskProximity> {
  const enriched = enrichTasksWithProximity(tasks, options)

  return enriched
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const aKey = proximitySortKey(a.task)
      const bKey = proximitySortKey(b.task)

      if (aKey !== bKey) return aKey - bKey
      return a.index - b.index
    })
    .map(({ task }) => task)
}

/** Future-ready helper for radius search / map bounds. */
export function isWithinRadiusKm(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number,
): boolean {
  return haversineDistanceKm(center, point) <= radiusKm
}
