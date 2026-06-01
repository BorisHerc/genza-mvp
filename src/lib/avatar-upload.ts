import { getSupabaseErrorMessage } from './errors'
import { supabase } from './supabase'

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function getExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }

  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

export async function uploadAvatar(userId: string, file: File) {
  if (!file.type.startsWith('image/')) {
    return { url: undefined as string | undefined, error: 'Please choose an image file.' }
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { url: undefined, error: 'Image must be 5 MB or smaller.' }
  }

  const extension = getExtension(file)
  const path = `${userId}/avatar.${extension}`

  console.log('[Genza] avatar upload', {
    userId,
    path,
    size: file.size,
    type: file.type,
  })

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[Genza] avatar upload failed', {
      userId,
      message: uploadError.message,
    })
    return { url: undefined, error: getSupabaseErrorMessage(uploadError) }
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`

  console.log('[Genza] avatar upload success', { userId, url })

  return { url, error: undefined }
}
