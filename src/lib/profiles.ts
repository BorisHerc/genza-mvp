import type { TaskCategory } from '../types'
import type { ProfileEditInput, ProfileStats, PublicProfile, UserMarketplaceStats } from '../types/profile'
import type { ProfileRow } from '../types/database'
import { getDefaultCurrencyForLocation, isSupportedCurrency, resolveTaskCurrency } from './currency'
import { getSupabaseErrorMessage } from './errors'
import { translate } from './i18n'
import { sameUserId } from './ids'
import { sanitizeBio, parseSkillsInput } from './profile-text'
import { DEFAULT_PROFILE_ROLE, normalizeSystemRole } from './roles'
import { normalizeUsername, validateUsername, suggestUsername } from './username'
import { supabase } from './supabase'

const PROFILE_COLUMNS =
  'id, full_name, avatar_url, role, location, username, bio, skills, service_categories, verified, suspended_at, currency, created_at, last_seen_at'

function mapStatsRow(row: {
  completed_jobs_count: number | string | null
  average_rating: number | string | null
  reviews_count: number | string | null
} | null): ProfileStats {
  return {
    completedJobsCount: Number(row?.completed_jobs_count ?? 0),
    averageRating: Number(row?.average_rating ?? 0),
    reviewsCount: Number(row?.reviews_count ?? 0),
  }
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc('get_profile_stats', { p_user_id: userId })

  if (error) {
    console.warn('[Genza] getProfileStats failed', { userId, error: error.message })
    return { completedJobsCount: 0, averageRating: 0, reviewsCount: 0 }
  }

  const row = Array.isArray(data) ? data[0] : data
  return mapStatsRow(row ?? null)
}

const TASK_CATEGORY_VALUES: TaskCategory[] = [
  'cleaning',
  'moving',
  'handyman',
  'delivery',
  'assembly',
  'gardening',
  'pet_care',
  'other',
]

function normalizeServiceCategories(values: string[] | null | undefined): TaskCategory[] {
  if (!values?.length) return []
  return values.filter((value): value is TaskCategory =>
    TASK_CATEGORY_VALUES.includes(value as TaskCategory),
  )
}

export function publicProfileFromRow(row: ProfileRow, stats: ProfileStats): PublicProfile {
  return mapPublicProfile(row, stats)
}

function mapPublicProfile(row: ProfileRow, stats: ProfileStats): PublicProfile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name?.trim() || translate('common.memberFallback'),
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    systemRole: normalizeSystemRole(row.role),
    location: row.location,
    bio: row.bio,
    skills: row.skills ?? [],
    serviceCategories: normalizeServiceCategories(row.service_categories),
    verified: Boolean(row.verified ?? true),
    joinedAt: row.created_at,
    stats,
    currency: isSupportedCurrency(row.currency) ? row.currency : resolveTaskCurrency(null, row.location),
  }
}

async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  return getProfileStats(userId)
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) return { profile: null as ProfileRow | null, error: getSupabaseErrorMessage(error) }
  return { profile: data as ProfileRow | null, error: undefined }
}

export async function fetchProfiles(userIds: string[]) {
  if (!userIds.length) return { profiles: [] as ProfileRow[], error: undefined }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('id', userIds)

  if (error) return { profiles: [] as ProfileRow[], error: getSupabaseErrorMessage(error) }
  return { profiles: (data ?? []) as ProfileRow[], error: undefined }
}

export async function fetchOwnProfileDashboard(userId: string) {
  console.log('[Genza] profile load', { userId })

  const [{ profile, error: profileError }, stats] = await Promise.all([
    fetchProfile(userId),
    fetchProfileStats(userId),
  ])

  if (profileError || !profile) {
    return { profile: null as PublicProfile | null, error: profileError || translate('profile.notFound') }
  }

  const publicProfile = mapPublicProfile(profile, stats)

  console.log('[Genza] profile load complete', {
    userId,
    username: publicProfile.username,
    completedJobsCount: stats.completedJobsCount,
    reviewsCount: stats.reviewsCount,
  })

  return { profile: publicProfile, error: undefined }
}

export async function fetchPublicProfileByUsername(usernameRaw: string) {
  const username = normalizeUsername(usernameRaw)

  console.log('[Genza] public profile fetch', { username })

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('username', username)
    .maybeSingle()

  if (error || !data) {
    return { profile: null as PublicProfile | null, error: getSupabaseErrorMessage(error) || translate('profile.notFound') }
  }

  const row = data as ProfileRow
  const stats = await fetchProfileStats(row.id)
  const profile = mapPublicProfile(row, stats)

  console.log('[Genza] public profile fetch complete', {
    username,
    userId: profile.id,
    role: profile.role,
  })

  return { profile, error: undefined }
}

export async function fetchPublicProfileByUserId(userId: string) {
  console.log('[Genza] public profile fetch', { userId })

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return { profile: null as PublicProfile | null, error: getSupabaseErrorMessage(error) || translate('profile.notFound') }
  }

  const row = data as ProfileRow
  const stats = await fetchProfileStats(row.id)
  const profile = mapPublicProfile(row, stats)

  console.log('[Genza] public profile fetch complete', {
    userId: profile.id,
    username: profile.username,
    role: profile.role,
  })

  return { profile, error: undefined }
}

export async function checkUsernameAvailability(usernameRaw: string, currentUserId?: string) {
  const username = normalizeUsername(usernameRaw)
  const validationError = validateUsername(username)

  console.log('[Genza] username availability', { username, currentUserId: currentUserId ?? null })

  if (validationError) {
    return { available: false, error: validationError }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return { available: false, error: getSupabaseErrorMessage(error) }
  }

  const available = !data || sameUserId(data.id, currentUserId)

  console.log('[Genza] username availability result', { username, available })

  return { available, error: available ? undefined : translate('profile.usernameTaken') }
}

export async function updateProfileRecord(userId: string, input: ProfileEditInput) {
  const username = normalizeUsername(input.username)
  const usernameError = validateUsername(username)
  if (usernameError) return { profile: null as ProfileRow | null, error: usernameError }

  const availability = await checkUsernameAvailability(username, userId)
  if (!availability.available) {
    return { profile: null, error: availability.error ?? translate('profile.usernameTaken') }
  }

  const payload = {
    full_name: input.fullName.trim(),
    username,
    location: input.location.trim(),
    bio: sanitizeBio(input.bio) || null,
    skills: parseSkillsInput(input.skills.join(', ')),
    service_categories: input.serviceCategories,
    avatar_url: input.avatarUrl ?? null,
    currency: input.currency && isSupportedCurrency(input.currency)
      ? input.currency
      : getDefaultCurrencyForLocation(input.location),
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) return { profile: null as ProfileRow | null, error: getSupabaseErrorMessage(error) }
  return { profile: data as ProfileRow, error: undefined }
}

export async function syncProfileFromSetup(
  userId: string,
  data: import('../types/auth').ProfileSetupData,
) {
  const avatarUrl = data.avatarUrl?.startsWith('http') ? data.avatarUrl : null
  const suggestedUsername = normalizeUsername(suggestUsername(data.fullName.trim(), userId))
  const currency = getDefaultCurrencyForLocation(data.location.trim())

  const { data: row, error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName.trim(),
      avatar_url: avatarUrl,
      role: DEFAULT_PROFILE_ROLE,
      location: data.location.trim(),
      username: suggestedUsername,
      currency,
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) return { profile: null as ProfileRow | null, error: getSupabaseErrorMessage(error) }
  return { profile: row as ProfileRow, error: undefined }
}

/** Mark the user as recently active for nearby task matching. */
export async function touchLastSeen(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)

  if (error && import.meta.env.DEV) {
    console.warn('[Genza] touchLastSeen failed', error.message)
  }
}

const ACTIVE_TASK_STATUSES = ['assigned', 'in_progress'] as const

export async function getUserMarketplaceStats(userId: string): Promise<UserMarketplaceStats> {
  const [
    postedResult,
    activeClientResult,
    activeTaskerResult,
    completedClientResult,
    completedTaskerResult,
    reviewsReceivedResult,
    reviewsWrittenResult,
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', [...ACTIVE_TASK_STATUSES]),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_tasker_id', userId)
      .in('status', [...ACTIVE_TASK_STATUSES]),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_tasker_id', userId)
      .eq('status', 'completed'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('reviewed_user_id', userId),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('reviewer_id', userId),
  ])

  return {
    postedTasksCount: postedResult.count ?? 0,
    activeJobsAsClient: activeClientResult.count ?? 0,
    activeJobsAsTasker: activeTaskerResult.count ?? 0,
    reviewsReceivedCount: reviewsReceivedResult.count ?? 0,
    reviewsWrittenCount: reviewsWrittenResult.count ?? 0,
    completedJobsAsTasker: completedTaskerResult.count ?? 0,
    completedTasksAsClient: completedClientResult.count ?? 0,
  }
}

/** @deprecated Use getUserMarketplaceStats */
export async function getClientTrustStats(userId: string) {
  const stats = await getUserMarketplaceStats(userId)
  return {
    postedTasksCount: stats.postedTasksCount,
    completedPaymentsCount: stats.completedTasksAsClient,
  }
}

export function getPublicProfilePath(profile: Pick<PublicProfile, 'username' | 'id'>) {
  if (profile.username) return `/u/${profile.username}`
  return `/tasker/${profile.id}`
}
