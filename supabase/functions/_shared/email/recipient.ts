import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/** notification_email from profile, otherwise auth.users email. */
export async function resolveRecipientEmail(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: profile } = await admin
    .from('profiles')
    .select('notification_email')
    .eq('id', userId)
    .maybeSingle()

  const profileEmail = profile?.notification_email?.trim()
  if (profileEmail) return profileEmail

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId)
  if (authError) {
    console.warn('[Genza] resolveRecipientEmail auth lookup failed', {
      userId,
      message: authError.message,
    })
    return null
  }

  const authEmail = authData.user?.email?.trim()
  return authEmail || null
}
