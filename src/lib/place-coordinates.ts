/** City-level coordinates for hyperlocal distance without exact addresses. */

export interface Coordinates {
  lat: number
  lng: number
}

interface PlaceEntry {
  hints: string[]
  lat: number
  lng: number
}

/** Extend this list as Genza expands — keyed by city / region hints. */
const PLACE_COORDINATES: PlaceEntry[] = [
  { hints: ['mostar'], lat: 43.3438, lng: 17.8078 },
  { hints: ['ljubuski', 'ljubuški'], lat: 43.1969, lng: 17.5403 },
  { hints: ['capljina', 'čapljina'], lat: 43.1128, lng: 17.7044 },
  { hints: ['medjugorje', 'međugorje'], lat: 43.1922, lng: 17.6758 },
  { hints: ['neum'], lat: 42.9228, lng: 17.6156 },
  { hints: ['stolac'], lat: 43.0839, lng: 17.9594 },
  { hints: ['konjic'], lat: 43.6514, lng: 17.9614 },
  { hints: ['jablanica'], lat: 43.6617, lng: 17.7567 },
  { hints: ['sarajevo'], lat: 43.8563, lng: 18.4131 },
  { hints: ['banja luka', 'banjaluka'], lat: 44.7722, lng: 17.191 },
  { hints: ['tuzla'], lat: 44.5383, lng: 18.6767 },
  { hints: ['zenica'], lat: 44.2014, lng: 17.9078 },
  { hints: ['bijeljina'], lat: 44.7569, lng: 19.2144 },
  { hints: ['trebinje'], lat: 42.7119, lng: 18.3436 },
  { hints: ['brcko', 'brčko'], lat: 44.8728, lng: 18.8083 },
  { hints: ['zagreb'], lat: 45.815, lng: 15.9819 },
  { hints: ['split'], lat: 43.5081, lng: 16.4402 },
  { hints: ['rijeka'], lat: 45.3271, lng: 14.4422 },
  { hints: ['ljubljana'], lat: 46.0569, lng: 14.5058 },
  { hints: ['beograd', 'belgrade'], lat: 44.7866, lng: 20.4489 },
  { hints: ['novi sad'], lat: 45.2671, lng: 19.8335 },
  { hints: ['wien', 'vienna', 'beč', 'bec'], lat: 48.2082, lng: 16.3738 },
  { hints: ['berlin'], lat: 52.52, lng: 13.405 },
  { hints: ['munich', 'münchen', 'munchen'], lat: 48.1351, lng: 11.582 },
  { hints: ['paris'], lat: 48.8566, lng: 2.3522 },
  { hints: ['rome', 'roma'], lat: 41.9028, lng: 12.4964 },
  { hints: ['amsterdam'], lat: 52.3676, lng: 4.9041 },
  { hints: ['prague', 'praha'], lat: 50.0755, lng: 14.4378 },
  { hints: ['budapest'], lat: 47.4979, lng: 19.0402 },
  { hints: ['warsaw', 'warszawa'], lat: 52.2297, lng: 21.0122 },
  { hints: ['athens'], lat: 37.9838, lng: 23.7275 },
  { hints: ['dublin'], lat: 53.3498, lng: -6.2603 },
  { hints: ['madrid'], lat: 40.4168, lng: -3.7038 },
  { hints: ['barcelona'], lat: 41.3851, lng: 2.1734 },
  { hints: ['stockholm'], lat: 59.3293, lng: 18.0686 },
  { hints: ['copenhagen', 'københavn', 'kobenhavn'], lat: 55.6761, lng: 12.5683 },
  { hints: ['helsinki'], lat: 60.1699, lng: 24.9384 },
  { hints: ['brussels', 'bruxelles'], lat: 50.8503, lng: 4.3517 },
  { hints: ['bucharest', 'bukurešt', 'bukurest'], lat: 44.4268, lng: 26.1025 },
  { hints: ['sofia'], lat: 42.6977, lng: 23.3219 },
  { hints: ['maribor'], lat: 46.5547, lng: 15.6459 },
]

function normalizePlace(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Compare city-level location strings (diacritic-insensitive). */
export function locationsShareCity(a?: string | null, b?: string | null): boolean {
  if (!a?.trim() || !b?.trim()) return false

  const normA = normalizePlace(a)
  const normB = normalizePlace(b)
  if (normA === normB) return true
  if (normA.includes(normB) || normB.includes(normA)) return true

  const cityA = normalizePlace(a.split(',')[0] ?? a)
  const cityB = normalizePlace(b.split(',')[0] ?? b)
  if (!cityA || !cityB) return false

  return cityA === cityB || cityA.includes(cityB) || cityB.includes(cityA)
}

/** Resolve a city-level location string to approximate coordinates. */
export function resolveLocationCoordinates(location?: string | null): Coordinates | null {
  if (!location?.trim()) return null

  const normalized = normalizePlace(location)
  const city = normalizePlace(location.split(',')[0] ?? location)

  for (const place of PLACE_COORDINATES) {
    if (place.hints.some((hint) => {
      const normalizedHint = normalizePlace(hint)
      return normalized.includes(normalizedHint) || city.includes(normalizedHint)
    })) {
      return { lat: place.lat, lng: place.lng }
    }
  }

  return null
}
