import { translate } from './i18n'

const DURATION_MARKER = '[genza:duration:'

export function encodeOfferMessage(
  message: string,
  options?: { estimatedDuration?: string },
) {
  const trimmed = message.trim()
  if (!options?.estimatedDuration?.trim()) return trimmed
  return `${DURATION_MARKER}${options.estimatedDuration.trim()}]\n${trimmed}`
}

export function parseOfferMessage(raw: string) {
  if (!raw.startsWith(DURATION_MARKER)) {
    return { message: raw, estimatedDuration: undefined as string | undefined }
  }

  const end = raw.indexOf(']\n')
  if (end === -1) return { message: raw, estimatedDuration: undefined }

  const estimatedDuration = raw.slice(DURATION_MARKER.length, end)
  const message = raw.slice(end + 2)
  return { message, estimatedDuration }
}

export function getOfferDurationOptions() {
  return [
    { value: 'under_1h', label: translate('offers.duration.under1h') },
    { value: '1_2h', label: translate('offers.duration.h1to2') },
    { value: '2_4h', label: translate('offers.duration.h2to4') },
    { value: 'half_day', label: translate('offers.duration.halfDay') },
    { value: 'full_day', label: translate('offers.duration.fullDay') },
    { value: 'flexible', label: translate('offers.duration.flexible') },
  ] as const
}

export function formatOfferDuration(value?: string) {
  return getOfferDurationOptions().find((option) => option.value === value)?.label ?? value
}

/** @deprecated Use getOfferDurationOptions() */
export const OFFER_DURATION_OPTIONS = getOfferDurationOptions()
