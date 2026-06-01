import { getActiveLocale, translate } from './i18n'

const BIO_MAX_LENGTH = 500
const MAX_SKILLS = 12
const MAX_SKILL_LENGTH = 32

export function sanitizeBio(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, BIO_MAX_LENGTH)
}

export function parseSkillsInput(value: string): string[] {
  const unique = new Set<string>()

  for (const part of value.split(/[,;\n]+/)) {
    const skill = part
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, MAX_SKILL_LENGTH)

    if (!skill) continue
    unique.add(skill)
    if (unique.size >= MAX_SKILLS) break
  }

  return [...unique]
}

export function formatSkillsForInput(skills: string[] | null | undefined): string {
  return (skills ?? []).join(', ')
}

export function formatJoinedDate(isoDate: string): string {
  const locale = getActiveLocale() === 'hr' ? 'hr-BA' : 'en-US'
  return new Date(isoDate).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

export function formatRating(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return translate('common.new')
  return value.toFixed(1)
}
