import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { checkAdminAccess, isUserSuspended } from '../../lib/admin-access'
import { getOnboardingPath } from '../../lib/auth-utils'
import { useTranslation } from '../../context/LocaleContext'
import { ErrorState } from '../ui/ErrorState'
import { AuthLoadingScreen } from './AuthLoadingScreen'

export function ProtectedRoute() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, isLoading, isProfileComplete, profile, signOut } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  }
  if (!isProfileComplete) {
    return <Navigate to={getOnboardingPath()} replace />
  }
  if (isUserSuspended(profile)) {
    return (
      <ErrorState
        message={t('auth.suspendedMessage')}
        actionLabel={t('auth.signOut')}
        onAction={() => void signOut()}
      />
    )
  }
  return <Outlet />
}

export function AdminRoute() {
  const { profile, user, isLoading, isProfileComplete } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (!isProfileComplete) return <Navigate to="/" replace />

  const isAdmin = checkAdminAccess(profile, user?.id)
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (isAuthenticated && isProfileComplete) return <Navigate to="/" replace />
  if (isAuthenticated && !isProfileComplete) {
    return <Navigate to={getOnboardingPath()} replace />
  }
  return <Outlet />
}

export function OnboardingRoute() {
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (!isAuthenticated) return <Navigate to="/auth/signup" replace />
  if (isProfileComplete) return <Navigate to="/" replace />
  return <Outlet />
}
