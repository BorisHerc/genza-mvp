import { useEffect, useState, type FormEvent } from 'react'
import { MapPin, Phone, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ProfileAvatarPicker } from '../../components/auth/ProfileAvatarPicker'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { MOCK_CITIES } from '../../data/mockAuth'
import { useTranslation } from '../../context/LocaleContext'

export function ProfileSetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { completeProfileSetup } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError(t('auth.enterFullName'))
      return
    }
    if (!location.trim()) {
      setError(t('auth.enterCity'))
      return
    }

    setIsSubmitting(true)

    const result = await completeProfileSetup({
      fullName,
      phone,
      location,
      avatarUrl: avatarPreview ?? undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      navigate('/', { replace: true })
      return
    }

    setError(result.error ?? t('auth.setupFailed'))
  }

  return (
    <AuthLayout
      title={t('auth.profileSetup')}
      subtitle={t('auth.profileSetupSubtitleDualRole')}
      backTo="/auth/signup"
      step={1}
      totalSteps={1}
      footer={
        <p className="text-sm text-gray-500">
          {t('auth.haveAccount')}{' '}
          <Link to="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('auth.signInAction')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProfileAvatarPicker
          name={fullName}
          imagePreview={avatarPreview}
          onImageSelect={(file) => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview)
            setAvatarPreview(URL.createObjectURL(file))
          }}
        />

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
          <Input label={t('auth.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} leftIcon={<User className="h-4 w-4" />} />
          <Input label={t('auth.phoneOptional')} value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
          <div>
            <Input label={t('auth.city')} value={location} onChange={(e) => setLocation(e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} list="city-suggestions" />
            <datalist id="city-suggestions">
              {MOCK_CITIES.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t('auth.savingProfile') : t('auth.finishSetup')}
        </Button>
      </form>
    </AuthLayout>
  )
}
