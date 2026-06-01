import { locationsShareCity } from './place-coordinates'
import { translate } from './i18n'

export function estimateLocationProximity(
  viewerLocation?: string | null,
  taskLocation?: string | null,
): string | undefined {
  if (locationsShareCity(viewerLocation, taskLocation)) {
    return translate('common.nearby')
  }
  return undefined
}
