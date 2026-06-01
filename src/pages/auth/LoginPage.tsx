import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LocaleContext'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = await signIn(email, password)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? t('auth.signInFailed'))
      return
    }

    const from = (location.state as { from?: string } | null)?.from
    if (result.onboardingStep) {
      navigate('/auth/profile-setup', { replace: true })
      return
    }
    navigate(from && from !== '/auth/login' ? from : '/', { replace: true })
  }

  return (
    <AuthLayout
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      showBack={false}
      footer={
        <p className="text-sm text-gray-500">
          {t('auth.noAccount')}{' '}
          <Link to="/auth/signup" className="font-semibold text-brand-600 hover:text-brand-700">
            {t('auth.signUp')}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="h-4 w-4" />} />
        <Input
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          rightElement={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.signInAction')}
        </Button>
      </form>
    </AuthLayout>
  )
}
