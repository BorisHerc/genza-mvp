import { useSyncGeolocationToProfile } from '../../hooks/useSyncGeolocationToProfile'

/** Side-effect hooks that must run inside auth + geolocation providers. */
export function AppEffects() {
  useSyncGeolocationToProfile()
  return null
}
