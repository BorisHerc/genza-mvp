import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Coordinates } from '../lib/place-coordinates'

const GEO_STORAGE_KEY = 'genza_coords'
const GEO_DENIED_KEY = 'genza_geolocation_denied'
const GEO_MAX_AGE_MS = 1000 * 60 * 60 * 12

export type GeolocationStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'denied'
  | 'unsupported'

interface StoredCoordinates extends Coordinates {
  accuracy?: number
  updatedAt: string
}

interface GeolocationContextValue {
  coords: Coordinates | null
  status: GeolocationStatus
  requestLocation: () => void
  dismissPrompt: () => void
  showPrompt: boolean
}

const GeolocationContext = createContext<GeolocationContextValue | null>(null)

function loadStoredCoordinates(): StoredCoordinates | null {
  try {
    const raw = localStorage.getItem(GEO_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredCoordinates
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null

    const age = Date.now() - new Date(parsed.updatedAt).getTime()
    if (age > GEO_MAX_AGE_MS) return null

    return parsed
  } catch {
    return null
  }
}

function saveCoordinates(coords: StoredCoordinates) {
  try {
    localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(coords))
    localStorage.removeItem(GEO_DENIED_KEY)
  } catch {
    // ignore storage errors
  }
}

function loadDeniedFlag(): boolean {
  try {
    return localStorage.getItem(GEO_DENIED_KEY) === '1'
  } catch {
    return false
  }
}

function saveDeniedFlag() {
  try {
    localStorage.setItem(GEO_DENIED_KEY, '1')
    localStorage.removeItem(GEO_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredCoordinates | null>(() => loadStoredCoordinates())
  const [status, setStatus] = useState<GeolocationStatus>(() => {
    if (stored) return 'ready'
    if (loadDeniedFlag()) return 'denied'
    if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported'
    return 'idle'
  })
  const [promptDismissed, setPromptDismissed] = useState(false)

  useEffect(() => {
    if (stored) setStatus('ready')
  }, [stored])

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: StoredCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: new Date().toISOString(),
        }
        saveCoordinates(next)
        setStored(next)
        setStatus('ready')
        setPromptDismissed(true)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          saveDeniedFlag()
          setStored(null)
          setStatus('denied')
        } else {
          setStatus(stored ? 'ready' : 'idle')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: GEO_MAX_AGE_MS,
      },
    )
  }, [stored])

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true)
  }, [])

  const showPrompt =
    !promptDismissed &&
    !stored &&
    status !== 'denied' &&
    status !== 'unsupported' &&
    status !== 'loading'

  const value = useMemo<GeolocationContextValue>(
    () => ({
      coords: stored ? { lat: stored.lat, lng: stored.lng } : null,
      status,
      requestLocation,
      dismissPrompt,
      showPrompt,
    }),
    [stored, status, requestLocation, dismissPrompt, showPrompt],
  )

  return <GeolocationContext.Provider value={value}>{children}</GeolocationContext.Provider>
}

export function useGeolocation() {
  const context = useContext(GeolocationContext)
  if (!context) {
    return {
      coords: null,
      status: 'idle' as GeolocationStatus,
      requestLocation: () => {},
      dismissPrompt: () => {},
      showPrompt: false,
    }
  }
  return context
}
