import { Camera, User } from 'lucide-react'
import { useTranslation } from '../../context/LocaleContext'
import { cn } from '../../lib/utils'

interface ProfileAvatarPickerProps {
  name?: string
  imagePreview?: string | null
  onImageSelect?: (file: File) => void
}

function getInitials(name?: string) {
  if (!name?.trim()) return null
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfileAvatarPicker({
  name,
  imagePreview,
  onImageSelect,
}: ProfileAvatarPickerProps) {
  const { t } = useTranslation()
  const initials = getInitials(name)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onImageSelect) {
      onImageSelect(file)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <label
        htmlFor="profile-avatar"
        className="group relative cursor-pointer"
      >
        <div
          className={cn(
            'flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-100 shadow-card ring-2 ring-brand-100 transition-all group-hover:ring-brand-300',
          )}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt={t('profile.avatarPreviewAlt')}
              className="h-full w-full object-cover"
            />
          ) : initials ? (
            <span className="text-2xl font-bold text-brand-700">{initials}</span>
          ) : (
            <User className="h-10 w-10 text-brand-400" />
          )}
        </div>

        <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-md transition-transform group-hover:scale-105">
          <Camera className="h-4 w-4" />
        </span>

        <input
          id="profile-avatar"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleChange}
        />
      </label>

      <p className="mt-3 text-sm font-medium text-gray-700">{t('trust.fieldPhoto')}</p>
      <p className="mt-0.5 text-xs text-gray-500">{t('profile.avatarTapUpload')}</p>
    </div>
  )
}
