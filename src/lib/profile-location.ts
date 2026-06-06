import type { Coordinates } from './place-coordinates'

export function buildProfileLocationLabel(city?: string | null, neighborhood?: string | null): string {
  const cityTrimmed = city?.trim() ?? ''
  const neighborhoodTrimmed = neighborhood?.trim() ?? ''
  if (cityTrimmed && neighborhoodTrimmed) return `${neighborhoodTrimmed}, ${cityTrimmed}`
  return cityTrimmed || neighborhoodTrimmed
}

export function profileCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): Coordinates | null {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { lat: latitude, lng: longitude }
}
