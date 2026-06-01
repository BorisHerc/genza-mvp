import { translate } from './i18n'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Matches Supabase auth user ids and other standard UUIDs. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}

/** Normalize auth user ids for reliable participant comparisons. */
export function normalizeUserId(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

export function sameUserId(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeUserId(a)
  const right = normalizeUserId(b)
  return left !== '' && left === right
}

/** Task/chat primary keys in this project are bigint serial ids (e.g. 4). */
export function parseNumericTaskId(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null
  }

  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null

  const parsed = Number(trimmed)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export const parseNumericChatId = parseNumericTaskId

export function assertOfferInsertPayload(taskIdRaw: string, taskerIdRaw: string):
  | { ok: true; taskId: number; taskerId: string }
  | { ok: false; error: string } {
  const taskId = parseNumericTaskId(taskIdRaw)
  if (taskId === null) {
    return {
      ok: false,
      error: isUuid(taskIdRaw)
        ? translate('api.invalidTaskReference')
        : translate('api.invalidTaskId'),
    }
  }

  const taskerId = taskerIdRaw.trim()
  if (!isUuid(taskerId)) {
    return {
      ok: false,
      error: translate('api.invalidSession'),
    }
  }

  return { ok: true, taskId, taskerId }
}

/** Dev-only, avoids logging full user ids. */
export function logOfferPayloadDebug(payload: { taskId: number; taskerIdPrefix: string }) {
  if (!import.meta.env.DEV) return
  console.debug('[Genza] offer insert payload', payload)
}
