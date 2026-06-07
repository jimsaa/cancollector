import { compressImageFile } from './imageCompression'
import { useGuestStorage } from './guestStorage'
import { supabase } from './supabase'

const BUCKET = 'can-images'

export interface PreparedCanImage {
  blob: Blob
  dataUrl: string
  mimeType: string
  warning?: string
}

/** Compress image for upload or local storage. */
export async function prepareCanImage(file: File): Promise<PreparedCanImage> {
  const result = await compressImageFile(file)
  return {
    blob: result.blob,
    dataUrl: result.dataUrl,
    mimeType: result.mimeType,
    warning: result.warning,
  }
}

/** Local Mode — return compressed base64 data URL. */
export async function uploadCanImageLocal(file: File): Promise<PreparedCanImage> {
  return prepareCanImage(file)
}

/**
 * Cloud Mode — upload to can-images/{user_id}/{can_id}.jpg
 * Uses upsert so re-uploads replace the existing file.
 */
export async function uploadCanImage(
  userId: string,
  canId: string,
  source: File | Blob,
): Promise<string> {
  if (useGuestStorage()) {
    const file = source instanceof File ? source : new File([source], 'can.jpg', { type: 'image/jpeg' })
    const prepared = await uploadCanImageLocal(file)
    return prepared.dataUrl
  }

  if (!supabase) {
    throw new Error('Supabase client unavailable')
  }

  let blob = source
  if (source instanceof File) {
    const prepared = await prepareCanImage(source)
    blob = prepared.blob
  }

  const path = `${userId}/${canId}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

  if (uploadError) {
    throw new Error(uploadError.message || 'Image upload failed')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteCanImage(imageUrl: string): Promise<void> {
  if (useGuestStorage() || imageUrl.startsWith('data:')) return
  if (!supabase || !imageUrl.includes(BUCKET)) return

  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return

  const path = imageUrl.slice(index + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}
