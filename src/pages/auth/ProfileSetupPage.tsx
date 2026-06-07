import { useEffect, useState, type FormEvent } from 'react'
import { Phone, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { ProfileAvatarPicker } from '../../components/auth/ProfileAvatarPicker'
import { OnboardingIntentStep } from '../../components/onboarding/OnboardingIntentStep'
import { PushNotificationsPanel } from '../../components/push/PushNotificationsPanel'
import { LocationSetupPanel } from '../../components/profile/LocationSetupPanel'
import { ServiceSetupPanel } from '../../components/profile/ServiceSetupPanel'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useGeolocation } from '../../context/GeolocationContext'
import { useTranslation } from '../../context/LocaleContext'
import {
  getOnboardingStepSubtitle,
  getOnboardingStepTitle,
  getOnboardingTotalSteps,
  intentNeedsServiceSetup,
} from '../../lib/onboarding'
import type { OnboardingIntent, StartingPrices } from '../../types/auth'
import type { TaskCategory } from '../../types'

export function ProfileSetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { completeProfileSetup, skipProfileSetup, session } = useAuth()
  const { coords } = useGeolocation()
  const [step, setStep] = useState(1)
  const [intent, setIntent] = useState<OnboardingIntent | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [notificationEmail, setNotificationEmail] = useState(session?.user?.email ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [serviceCategories, setServiceCategories] = useState<TaskCategory[]>([])
  const [startingPrices, setStartingPrices] = useState<StartingPrices>({})
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (session?.user?.email && !notificationEmail) {
      setNotificationEmail(session.user.email)
    }
  }, [session?.user?.email, notificationEmail])

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const needsServices = intentNeedsServiceSetup(intent)

  const goNextFromIntent = () => {
    setError('')
    if (!intent) return setError(t('auth.pickOnboardingIntent'))
    setStep(2)
  }

  const goNextFromBasic = () => {
    setError('')
    if (!fullName.trim()) return setError(t('auth.enterFullName'))
    setStep(3)
  }

  const handleSkip = async () => {
    setError('')
    setIsSubmitting(true)
    const result = await skipProfileSetup({
      onboardingIntent: intent ?? undefined,
      fullName: fullName.trim() || undefined,
    })
    setIsSubmitting(false)
    if (result.success) navigate('/', { replace: true })
    else setError(result.error ?? t('auth.setupFailed'))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!location.trim()) return setError(t('auth.enterCity'))
    if (needsServices && !serviceCategories.length) {
      return setError(t('profile.pickServiceCategory'))
    }

    setIsSubmitting(true)

    const result = await completeProfileSetup({
      fullName,
      phone,
      location,
      neighborhood,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      onboardingIntent: intent ?? undefined,
      serviceCategories: needsServices ? serviceCategories : [],
      startingPrices: needsServices ? startingPrices : {},
      availabilityEnabled: needsServices ? availabilityEnabled : false,
      notificationEmail: notificationEmail.trim() || session?.user?.email,
      avatarUrl: avatarPreview ?? undefined,
      avatarFile: avatarFile ?? undefined,
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
      title={getOnboardingStepTitle(step, intent, t)}
      subtitle={getOnboardingStepSubtitle(step, intent, t)}
      showBack={step > 1}
      onBack={() => setStep((current) => Math.max(1, current - 1))}
      step={step}
      totalSteps={getOnboardingTotalSteps(intent)}
      footer={
        <p className="text-sm text-gray-500">
          {t('auth.haveAccount')}{' '}
          <Link to="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('auth.signInAction')}
          </Link>
        </p>
      }
    >
      {step === 1 && (
        <div className="space-y-6">
          <OnboardingIntentStep value={intent} onChange={setIntent} />

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="button" size="lg" fullWidth onClick={goNextFromIntent}>
            {t('auth.continueSetup')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={isSubmitting}
            onClick={() => void handleSkip()}
          >
            {t('onboarding.skipForNow')}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <ProfileAvatarPicker
            name={fullName}
            imagePreview={avatarPreview}
            onImageSelect={(file) => {
              if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
              setAvatarFile(file)
              setAvatarPreview(URL.createObjectURL(file))
            }}
          />

          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
            <Input
              label={t('auth.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label={t('auth.phoneOptional')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="button" size="lg" fullWidth onClick={goNextFromBasic}>
            {t('auth.continueSetup')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={isSubmitting}
            onClick={() => void handleSkip()}
          >
            {t('onboarding.skipForNow')}
          </Button>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {needsServices ? (
            <ServiceSetupPanel
              location={location}
              neighborhood={neighborhood}
              notificationEmail={notificationEmail}
              serviceCategories={serviceCategories}
              startingPrices={startingPrices}
              availabilityEnabled={availabilityEnabled}
              onLocationChange={setLocation}
              onNeighborhoodChange={setNeighborhood}
              onNotificationEmailChange={setNotificationEmail}
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
              categoryError={error && !serviceCategories.length ? error : undefined}
              locationError={error && !location.trim() ? error : undefined}
            />
          ) : (
            <LocationSetupPanel
              location={location}
              neighborhood={neighborhood}
              onLocationChange={setLocation}
              onNeighborhoodChange={setNeighborhood}
              locationError={error && !location.trim() ? error : undefined}
            />
          )}

          {error && (needsServices ? serviceCategories.length > 0 && location.trim() : location.trim()) && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <PushNotificationsPanel compact />

          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setStep(2)}>
              {t('common.back')}
            </Button>
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? t('auth.savingProfile') : t('auth.finishSetup')}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={isSubmitting}
            onClick={() => void handleSkip()}
          >
            {t('onboarding.skipForNow')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
