import { compressImageFile } from './imageCompression'
import { useGuestStorage } from './guestStorage'
import { supabase } from './supabase'

const BUCKET = 'trade-images'

export async function uploadTradeExtraImage(
  userId: string,
  listingId: string,
  imageNumber: number,
  file: File,
): Promise<string> {
  const compressed = await compressImageFile(file)

  if (useGuestStorage()) {
    return compressed.dataUrl
  }

  if (!supabase) throw new Error('Supabase client unavailable')

  const path = `${userId}/${listingId}/image-${imageNumber}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed.blob, { upsert: true, contentType: compressed.mimeType })

  if (error) throw new Error(error.message || 'Image upload failed')

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteTradeExtraImage(imageUrl: string): Promise<void> {
  if (useGuestStorage() || imageUrl.startsWith('data:')) return
  if (!supabase || !imageUrl.includes(BUCKET)) return

  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return

  const path = imageUrl.slice(index + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}
