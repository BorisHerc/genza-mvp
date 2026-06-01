import { hrLegalDocuments } from './hr'
import type { LegalDocument, LegalSlug } from './types'
import { LEGAL_SLUGS } from './types'

export type { LegalDocument, LegalSlug } from './types'
export { LEGAL_SLUGS } from './types'

const documentsBySlug = new Map<LegalSlug, LegalDocument>(
  hrLegalDocuments.map((doc) => [doc.slug, doc]),
)

export function getLegalDocument(slug: string): LegalDocument | undefined {
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) return undefined
  return documentsBySlug.get(slug as LegalSlug)
}

export function getAllLegalDocuments(): LegalDocument[] {
  return hrLegalDocuments
}

export const LEGAL_PATHS: Record<LegalSlug, string> = {
  terms: '/terms',
  privacy: '/privacy',
  disclaimer: '/disclaimer',
  community: '/community-guidelines',
  safety: '/safety',
  cookies: '/cookies',
}

export function getLegalPath(slug: LegalSlug) {
  return LEGAL_PATHS[slug]
}

export function resolveLegalSlugFromPath(pathname: string): LegalSlug | undefined {
  const path = pathname.replace(/\/$/, '') || pathname

  for (const slug of LEGAL_SLUGS) {
    if (path === LEGAL_PATHS[slug]) return slug
  }

  const legacy = path.match(/^\/legal\/([a-z]+)$/)
  if (legacy && LEGAL_SLUGS.includes(legacy[1] as LegalSlug)) {
    return legacy[1] as LegalSlug
  }

  return undefined
}

export const TRUST_SAFETY_PATH = '/trust'
