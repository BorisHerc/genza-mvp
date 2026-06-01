export type LegalSlug =
  | 'terms'
  | 'privacy'
  | 'disclaimer'
  | 'community'
  | 'safety'
  | 'cookies'

export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; variant: 'info' | 'warning'; title?: string; text: string }

export interface LegalSection {
  id: string
  title: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  slug: LegalSlug
  title: string
  subtitle: string
  lastUpdated: string
  sections: LegalSection[]
}

export const LEGAL_SLUGS: LegalSlug[] = [
  'terms',
  'privacy',
  'disclaimer',
  'community',
  'safety',
  'cookies',
]
