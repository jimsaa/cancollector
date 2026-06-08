import { compressImageFile } from './imageCompression'
import { supabase } from './supabase'

const BUCKET = 'feedback-screenshots'

export async function uploadFeedbackScreenshot(
  userId: string,
  feedbackId: string,
  file: File,
): Promise<string> {
  if (!supabase) throw new Error('Supabase client unavailable')

  const compressed = await compressImageFile(file)
  const path = `${userId}/${feedbackId}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed.blob, { upsert: true, contentType: 'image/jpeg' })

  if (error) throw new Error(error.message || 'Screenshot upload failed')

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
