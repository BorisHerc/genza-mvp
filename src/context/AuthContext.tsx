import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  clearSelectedRole,
  getAuthErrorMessage,
  getOnboardingStep,
  isProfileComplete,
  mapUserToProfile,
} from '../lib/auth-utils'
import { fetchProfile, syncProfileFromSetup, touchLastSeen } from '../lib/profiles'
import { uploadAvatar } from '../lib/avatar-upload'
import { DEFAULT_PROFILE_ROLE } from '../lib/roles'
import { clearStaleAuthSession, isRefreshTokenError } from '../lib/auth-session'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { ProfileRow } from '../types/database'
import type { AuthProfile, OnboardingIntent, ProfileSetupData, SignUpCredentials } from '../types/auth'
import { shouldShowProfileCompletionReminder } from '../lib/onboarding'

interface AuthResult {
  success: boolean
  error?: string
  needsEmailConfirmation?: boolean
  onboardingStep?: 'profile' | null
}

interface AuthContextValue {
  user: AuthProfile | null
  profile: ProfileRow | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isProfileComplete: boolean
  needsProfileCompletionReminder: boolean
  onboardingStep: 'profile' | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>
  signOut: () => Promise<void>
  completeProfileSetup: (data: ProfileSetupData) => Promise<AuthResult>
  skipProfileSetup: (input?: { onboardingIntent?: OnboardingIntent; fullName?: string }) => Promise<AuthResult>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [user, setUser] = useState<AuthProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUserProfile = useCallback(async (authUser: User) => {
    const { profile: profileRow } = await fetchProfile(authUser.id)
    setProfile(profileRow)
    setUser(mapUserToProfile(authUser, profileRow))
    return profileRow
  }, [])

  const syncSession = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession)
      if (nextSession?.user) {
        return loadUserProfile(nextSession.user)
      }
      setProfile(null)
      setUser(null)
      return null
    },
    [loadUserProfile],
  )

  useEffect(() => {
    let mounted = true

    async function init() {
      clearSelectedRole()

      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error && isRefreshTokenError(error.message)) {
        console.warn('[Genza] Stale refresh token on init — signing out locally', error.message)
        await clearStaleAuthSession()
        setSession(null)
        setProfile(null)
        setUser(null)
        setIsLoading(false)
        return
      }

      await syncSession(data.session)
      setIsLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (String(event) === 'TOKEN_REFRESH_FAILED') {
        console.warn('[Genza] TOKEN_REFRESH_FAILED — clearing local session')
        void clearStaleAuthSession().then(() => {
          setSession(null)
          setProfile(null)
          setUser(null)
        })
        return
      }

      void syncSession(nextSession).then((profileRow) => {
        if (nextSession?.user && isProfileComplete(nextSession.user, profileRow)) {
          clearSelectedRole()
        }
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [syncSession])

  useEffect(() => {
    if (!session?.user?.id) return
    void touchLastSeen(session.user.id, session.user.email)
  }, [session?.user?.id, session?.user?.email])

  const profileComplete = isProfileComplete(session?.user, profile)
  const onboardingStep = getOnboardingStep(session?.user, profile)
  const needsProfileCompletionReminder = shouldShowProfileCompletionReminder(
    user,
    user?.onboardingIntent,
  )

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) return { success: false, error: getAuthErrorMessage(error) }
    const profileRow = await loadUserProfile(data.session.user)
    setSession(data.session)
    return {
      success: true,
      onboardingStep: getOnboardingStep(data.session.user, profileRow),
    }
  }, [loadUserProfile])

  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' }
    }

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    })

    if (error) return { success: false, error: getAuthErrorMessage(error) }
    if (!data.session) return { success: true, needsEmailConfirmation: true }

    clearSelectedRole()
    await syncSession(data.session)
    return { success: true }
  }, [syncSession])

  const signOut = useCallback(async () => {
    clearSelectedRole()
    await supabase.auth.signOut()
    await syncSession(null)
  }, [syncSession])

  const completeProfileSetup = useCallback(
    async (data: ProfileSetupData) => {
      const authUser = session?.user
      if (!authUser) return { success: false, error: 'Please sign in to continue.' }

      let avatarUrl = data.avatarUrl?.startsWith('http') ? data.avatarUrl : undefined
      if (data.avatarFile) {
        const upload = await uploadAvatar(authUser.id, data.avatarFile)
        if (upload.error) return { success: false, error: upload.error }
        avatarUrl = upload.url
      }

      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName.trim(),
          phone: data.phone.trim(),
          location: data.location.trim(),
          neighborhood: data.neighborhood?.trim(),
          role: DEFAULT_PROFILE_ROLE,
          avatar_url: avatarUrl,
          onboarding_intent: data.onboardingIntent ?? null,
          onboarding_skipped: false,
          profile_complete: true,
        },
      })

      if (metaError) return { success: false, error: getAuthErrorMessage(metaError) }

      const { profile: updatedProfile, error: profileError } = await syncProfileFromSetup(
        authUser.id,
        {
          ...data,
          avatarUrl,
          notificationEmail: data.notificationEmail ?? authUser.email ?? undefined,
        },
      )

      if (profileError) {
        return { success: false, error: profileError }
      }

      clearSelectedRole()
      setProfile(updatedProfile)
      setUser(mapUserToProfile(authUser, updatedProfile))
      return { success: true }
    },
    [session],
  )

  const skipProfileSetup = useCallback(
    async (input?: { onboardingIntent?: OnboardingIntent; fullName?: string }) => {
      const authUser = session?.user
      if (!authUser) return { success: false, error: 'Please sign in to continue.' }

      const displayName =
        input?.fullName?.trim() ||
        String(authUser.user_metadata?.full_name ?? '').trim() ||
        authUser.email?.split('@')[0] ||
        'Član'

      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          full_name: displayName,
          role: DEFAULT_PROFILE_ROLE,
          onboarding_intent: input?.onboardingIntent ?? null,
          onboarding_skipped: true,
          profile_complete: true,
        },
      })

      if (metaError) return { success: false, error: getAuthErrorMessage(metaError) }

      const { profile: updatedProfile, error: profileError } = await syncProfileFromSetup(
        authUser.id,
        {
          fullName: displayName,
          phone: '',
          location: '',
          skipped: true,
          onboardingIntent: input?.onboardingIntent,
          notificationEmail: authUser.email ?? undefined,
        },
      )

      if (profileError) return { success: false, error: profileError }

      clearSelectedRole()
      setProfile(updatedProfile)
      setUser(mapUserToProfile(authUser, updatedProfile))
      return { success: true }
    },
    [session],
  )

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadUserProfile(session.user)
  }, [session, loadUserProfile])

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isAuthenticated: Boolean(session?.user),
      isLoading,
      isProfileComplete: profileComplete,
      needsProfileCompletionReminder,
      onboardingStep,
      signIn,
      signUp,
      signOut,
      completeProfileSetup,
      skipProfileSetup,
      refreshProfile,
    }),
    [
      user, profile, session, isLoading, profileComplete, needsProfileCompletionReminder, onboardingStep,
      signIn, signUp, signOut, completeProfileSetup, skipProfileSetup, refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
