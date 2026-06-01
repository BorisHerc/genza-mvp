import { useTranslation } from '../../context/LocaleContext'

interface ProfileSkillsTagsProps {
  skills: string[]
}

export function ProfileSkillsTags({ skills }: ProfileSkillsTagsProps) {
  const { t } = useTranslation()

  if (!skills.length) {
    return (
      <p className="text-sm text-gray-500">{t('profile.noSkillsYet')}</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
        >
          {skill}
        </span>
      ))}
    </div>
  )
}
