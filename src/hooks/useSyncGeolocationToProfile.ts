import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../context/GeolocationContext'
import { saveProfileCoordinates } from '../lib/profiles'

/** Persist browser GPS coordinates to the user profile for reliable nearby matching. */
export function useSyncGeolocationToProfile() {
  const { user } = useAuth()
  const { coords, status } = useGeolocation()
  const lastSynced = useRef<string | null>(null)

  useEffect(() => {
    if (!user?.id || !coords || status !== 'ready') return

    const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`
    if (lastSynced.current === key) return
    lastSynced.current = key

    void saveProfileCoordinates(user.id, coords)
  }, [user?.id, coords, status])
}
