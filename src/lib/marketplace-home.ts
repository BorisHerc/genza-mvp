import { fetchProfiles, getProfileStats, publicProfileFromRow } from './profiles'
import { supabase } from './supabase'

async function enrichProfilesToPublic(profiles: Awaited<ReturnType<typeof fetchProfiles>>['profiles']) {
  const enriched = await Promise.all(
    profiles.map(async (row) => publicProfileFromRow(row, await getProfileStats(row.id))),
  )

  return enriched
    .filter((profile) => profile.systemRole !== 'admin')
    .sort(
      (a, b) =>
        b.stats.completedJobsCount - a.stats.completedJobsCount ||
        b.stats.averageRating - a.stats.averageRating,
    )
}

export async function listFeaturedTaskers(limit = 6) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, location, username, bio, skills, service_categories, verified, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .limit(Math.max(limit * 4, 24))

  if (error || !data?.length) {
    return { taskers: [] as import('../types/profile').PublicProfile[], error: error?.message }
  }

  const { profiles } = await fetchProfiles(data.map((row) => row.id))
  const taskers = (await enrichProfilesToPublic(profiles))
    .filter((profile) => profile.stats.completedJobsCount > 0 || profile.stats.reviewsCount > 0)
    .slice(0, limit)

  return { taskers, error: undefined }
}
