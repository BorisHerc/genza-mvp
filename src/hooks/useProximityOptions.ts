import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../context/GeolocationContext'
import type { ProximityOptions } from '../lib/distance'
import { buildProfileLocationLabel, profileCoordinates } from '../lib/profile-location'

export function useProximityOptions(): ProximityOptions {
  const { user } = useAuth()
  const { coords } = useGeolocation()

  const profileCoords = useMemo(
    () => profileCoordinates(user?.latitude, user?.longitude),
    [user?.latitude, user?.longitude],
  )

  const viewerLocation = useMemo(
    () => buildProfileLocationLabel(user?.location, user?.neighborhood),
    [user?.location, user?.neighborhood],
  )

  return useMemo(
    () => ({
      userCoords: coords,
      profileCoords,
      profileLocation: viewerLocation || user?.location,
      viewerLocation: viewerLocation || user?.location,
    }),
    [coords, profileCoords, viewerLocation, user?.location],
  )
}
