import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LocaleContext'
import { getLegalPath } from '../../content/legal'

export function SignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const errors: Record<string, string> = {}

    if (!acceptedTerms) errors.terms = t('auth.acceptTermsRequired')
    if (password.length < 6) errors.password = t('auth.passwordMinLength')
    if (password !== confirmPassword) errors.confirmPassword = t('auth.passwordsMismatch')
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    const result = await signUp({ email, password })
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? t('auth.signUpFailed'))
      return
    }

    if (result.needsEmailConfirmation) {
      setError(t('auth.confirmEmailPrompt'))
      return
    }

    navigate('/auth/profile-setup')
  }

  return (
    <AuthLayout
      title={t('auth.createAccount')}
      subtitle={t('auth.signUpSubtitle')}
      backTo="/auth/login"
      footer={
        <p className="text-sm text-gray-500">
          {t('auth.haveAccount')}{' '}
          <Link
            to="/auth/login"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            {t('auth.signInAction')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('auth.email')}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Input
          label={t('auth.password')}
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          leftIcon={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <Input
          label={t('auth.confirmPassword')}
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={t('auth.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors.confirmPassword}
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-600">
            {t('auth.agreeTermsPrefix')}{' '}
            <Link to={getLegalPath('terms')} className="font-semibold text-brand-600 hover:underline">
              {t('auth.termsOfService')}
            </Link>{' '}
            {t('auth.and')}{' '}
            <Link to={getLegalPath('privacy')} className="font-semibold text-brand-600 hover:underline">
              {t('auth.privacyPolicy')}
            </Link>
          </span>
        </label>

        {fieldErrors.terms && (
          <p className="text-xs font-medium text-red-500">{fieldErrors.terms}</p>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          className="mt-2"
        >
          {isSubmitting ? t('auth.creatingAccount') : t('auth.signUpAction')}
        </Button>
      </form>
    </AuthLayout>
  )
}
