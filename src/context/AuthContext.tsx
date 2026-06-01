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
import { DEFAULT_PROFILE_ROLE } from '../lib/roles'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { ProfileRow } from '../types/database'
import type { AuthProfile, ProfileSetupData, SignUpCredentials } from '../types/auth'

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
  onboardingStep: 'profile' | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>
  signOut: () => Promise<void>
  completeProfileSetup: (data: ProfileSetupData) => Promise<AuthResult>
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
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      await syncSession(data.session)
      setIsLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    void touchLastSeen(session.user.id)
  }, [session?.user?.id])

  const profileComplete = isProfileComplete(session?.user, profile)
  const onboardingStep = getOnboardingStep(session?.user, profile)

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

      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName.trim(),
          phone: data.phone.trim(),
          location: data.location.trim(),
          role: DEFAULT_PROFILE_ROLE,
          avatar_url: data.avatarUrl?.startsWith('http') ? data.avatarUrl : undefined,
          profile_complete: true,
        },
      })

      if (metaError) return { success: false, error: getAuthErrorMessage(metaError) }

      const { profile: updatedProfile, error: profileError } = await syncProfileFromSetup(
        authUser.id,
        data,
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
      onboardingStep,
      signIn,
      signUp,
      signOut,
      completeProfileSetup,
      refreshProfile,
    }),
    [
      user, profile, session, isLoading, profileComplete, onboardingStep,
      signIn, signUp, signOut, completeProfileSetup, refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
