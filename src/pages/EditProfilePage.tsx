import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LanguageSwitcher } from '../components/i18n/LanguageSwitcher'
import { LocationPromptBanner } from '../components/location/LocationPromptBanner'
import { ServiceOfferingFields } from '../components/profile/ServiceOfferingFields'
import { ProfileAvatarPicker } from '../components/auth/ProfileAvatarPicker'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageLoader } from '../components/ui/PageLoader'
import { Textarea } from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../context/GeolocationContext'
import { useCurrency } from '../context/CurrencyContext'
import { useToast } from '../context/ToastContext'
import { uploadAvatar } from '../lib/avatar-upload'
import { useTranslation } from '../context/LocaleContext'
import { CURRENCY_META, SUPPORTED_CURRENCIES, type SupportedCurrency } from '../lib/currency'
import { formatSkillsForInput, parseSkillsInput, sanitizeBio } from '../lib/profile-text'
import {
  checkUsernameAvailability,
  fetchOwnProfileDashboard,
  updateProfileRecord,
} from '../lib/profiles'
import { validateUsername } from '../lib/username'
import { cn } from '../lib/utils'
import type { StartingPrices } from '../types/auth'
import type { TaskCategory } from '../types'

export function EditProfilePage() {
  const navigate = useNavigate()
  const { user, session, refreshProfile } = useAuth()
  const { coords, requestLocation } = useGeolocation()
  const { t } = useTranslation()
  const { setCurrency, getCurrencyLabel } = useCurrency()
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [location, setLocation] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [profileCurrency, setProfileCurrency] = useState<SupportedCurrency>('BAM')
  const [bio, setBio] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [serviceCategories, setServiceCategories] = useState<TaskCategory[]>([])
  const [startingPrices, setStartingPrices] = useState<StartingPrices>({})
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user?.id) return

      const result = await fetchOwnProfileDashboard(user.id)
      if (cancelled || !result.profile) {
        setIsLoading(false)
        return
      }

      setFullName(result.profile.fullName)
      setUsername(result.profile.username ?? '')
      setLocation(result.profile.location ?? '')
      setNeighborhood(result.profile.neighborhood ?? '')
      setBio(result.profile.bio ?? '')
      setSkillsInput(formatSkillsForInput(result.profile.skills))
      setServiceCategories(result.profile.serviceCategories ?? [])
      setStartingPrices(result.profile.startingPrices ?? {})
      setAvailabilityEnabled(result.profile.availabilityEnabled !== false)
      setAvatarPreview(result.profile.avatarUrl ?? null)
      if (result.profile.currency) setProfileCurrency(result.profile.currency)
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus('idle')
      return
    }

    const validationError = validateUsername(username)
    if (validationError) {
      setUsernameStatus('taken')
      return
    }

    setUsernameStatus('checking')
    const timer = window.setTimeout(async () => {
      const result = await checkUsernameAvailability(username, user?.id)
      setUsernameStatus(result.available ? 'available' : 'taken')
    }, 400)

    return () => window.clearTimeout(timer)
  }, [username, user?.id])

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  if (!user) return null

  if (isLoading) {
    return <PageLoader label={t('profile.loading')} className="min-h-[60dvh]" />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError(t('profile.fullNameRequired'))
      return
    }

    if (usernameStatus === 'taken') {
      setError(t('profile.chooseDifferentUsername'))
      return
    }

    setIsSaving(true)

    let avatarUrl = avatarPreview?.startsWith('http') ? avatarPreview : user.avatarUrl

    if (avatarFile) {
      const upload = await uploadAvatar(user.id, avatarFile)
      if (upload.error) {
        setIsSaving(false)
        setError(upload.error)
        return
      }
      avatarUrl = upload.url
    }

    const result = await updateProfileRecord(user.id, {
      fullName: fullName.trim(),
      username,
      location,
      neighborhood,
      latitude: coords?.lat ?? user.latitude ?? null,
      longitude: coords?.lng ?? user.longitude ?? null,
      bio: sanitizeBio(bio),
      skills: parseSkillsInput(skillsInput),
      serviceCategories,
      startingPrices,
      availabilityEnabled,
      notificationEmail: session?.user?.email ?? user.email,
      avatarUrl: avatarUrl ?? null,
      currency: profileCurrency,
    })

    setIsSaving(false)

    if (result.error || !result.profile) {
      toast.error(result.error ?? t('profile.saveFailed'))
      setError(result.error ?? t('profile.saveFailed'))
      return
    }

    toast.success(t('profile.saveSuccess'))
    setCurrency(profileCurrency)
    await refreshProfile()
    navigate('/profile')
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('profile.backToProfile')}
      </button>

      <h1 className="mb-1 text-xl font-bold text-gray-900">{t('profile.edit')}</h1>
      <p className="mb-6 text-sm text-gray-500">{t('profile.editSubtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <LocationPromptBanner />

        <Card className="flex justify-center py-6">
          <ProfileAvatarPicker
            name={fullName}
            imagePreview={avatarPreview}
            onImageSelect={(file) => {
              if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
              setAvatarFile(file)
              setAvatarPreview(URL.createObjectURL(file))
            }}
          />
        </Card>

        <Input
          label={t('auth.fullName')}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />

        <div>
          <Input
            label={t('trust.fieldUsername')}
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            hint={t('profile.usernameUrlHint')}
            required
          />
          {usernameStatus === 'checking' && (
            <p className="mt-1 text-xs text-gray-500">{t('profile.checkingUsername')}</p>
          )}
          {usernameStatus === 'available' && (
            <p className="mt-1 text-xs text-green-600">{t('profile.usernameAvailable')}</p>
          )}
          {usernameStatus === 'taken' && (
            <p className="mt-1 text-xs text-red-600">
              {validateUsername(username) ?? t('profile.usernameTaken')}
            </p>
          )}
        </div>

        <Input
          label={t('auth.city')}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={t('profile.cityPlaceholder')}
        />

        <Input
          label={t('profile.neighborhood')}
          value={neighborhood}
          onChange={(event) => setNeighborhood(event.target.value)}
          hint={t('profile.neighborhoodHint')}
        />

        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
          <p className="text-xs font-medium text-gray-700">
            {coords ? t('geolocation.coordsSaved') : t('geolocation.manualFallbackHint')}
          </p>
          {!coords && (
            <Button type="button" size="sm" className="mt-2" onClick={requestLocation}>
              {t('geolocation.enable')}
            </Button>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-gray-700">{t('currency.preference')}</p>
          <p className="mb-3 text-xs text-gray-500">{t('currency.preferenceHint')}</p>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_CURRENCIES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setProfileCurrency(code)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all',
                  profileCurrency === code
                    ? 'border-brand-600 bg-brand-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-brand-300',
                )}
              >
                <p className="text-lg font-bold text-brand-700">{CURRENCY_META[code].symbol}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{getCurrencyLabel(code)}</p>
              </button>
            ))}
          </div>
        </div>

        <LanguageSwitcher className="rounded-2xl border border-gray-100 bg-white p-4" />

        <Textarea
          label={t('trust.fieldBio')}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder={t('profile.bioPlaceholder')}
          rows={4}
        />

        <ServiceOfferingFields
          serviceCategories={serviceCategories}
          startingPrices={startingPrices}
          availabilityEnabled={availabilityEnabled}
          onCategoriesChange={setServiceCategories}
          onStartingPriceChange={(category, value) => {
            const amount = Number(value)
            setStartingPrices((current) => {
              const next = { ...current }
              if (!value || !Number.isFinite(amount) || amount <= 0) {
                delete next[category]
                return next
              }
              next[category] = amount
              return next
            })
          }}
          onAvailabilityChange={setAvailabilityEnabled}
        />

        <Input
          label={t('profile.skills')}
          value={skillsInput}
          onChange={(event) => setSkillsInput(event.target.value)}
          hint={t('profile.skillsHint')}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" fullWidth disabled={isSaving || usernameStatus === 'checking'}>
          {isSaving ? t('auth.savingProfile') : t('profile.saveProfile')}
        </Button>
      </form>
    </div>
  )
}
