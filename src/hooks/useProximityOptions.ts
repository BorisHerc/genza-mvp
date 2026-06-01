import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../context/GeolocationContext'
import type { ProximityOptions } from '../lib/distance'

export function useProximityOptions(): ProximityOptions {
  const { user } = useAuth()
  const { coords } = useGeolocation()

  return useMemo(
    () => ({
      userCoords: coords,
      profileLocation: user?.location,
      viewerLocation: user?.location,
    }),
    [coords, user?.location],
  )
}
