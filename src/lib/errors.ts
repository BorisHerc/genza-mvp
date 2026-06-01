import { translate } from './i18n'

export function getSupabaseErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return translate('errors.generic')
  }

  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : ''

  if (message.includes('row-level security')) {
    return translate('errors.permission')
  }

  if (message.includes('duplicate key')) {
    return translate('errors.duplicate')
  }

  return message || translate('errors.generic')
}

export function getSupabaseRawErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return translate('common.unknown')
  if ('message' in error && typeof error.message === 'string') return error.message
  if ('details' in error && typeof error.details === 'string') return error.details
  return translate('common.unknown')
}

/** Surfaces which accept-flow step failed; includes raw Postgres message in dev. */
export function getSupabaseStepError(step: string, error: unknown): string {
  const friendly = getSupabaseErrorMessage(error)
  const raw = getSupabaseRawErrorMessage(error)

  if (import.meta.env.DEV && raw !== friendly) {
    return translate('errors.stepPrefix', { step, message: `${friendly} (${raw})` })
  }

  return translate('errors.stepPrefix', { step, message: friendly })
}

export function isRlsError(error: unknown): boolean {
  return getSupabaseRawErrorMessage(error).includes('row-level security')
}
