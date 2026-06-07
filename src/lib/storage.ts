import { generateId } from './id'
import { isLocalMode } from './mode'
import { supabase } from './supabase'

const BUCKET = 'can-images'

function uploadCanImageLocal(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

export async function uploadCanImage(_userId: string, file: File): Promise<string> {
  if (isLocalMode) return uploadCanImageLocal(file)

  if (!supabase) {
    throw new Error('Supabase client unavailable')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${_userId}/${generateId()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteCanImage(imageUrl: string): Promise<void> {
  if (isLocalMode || !imageUrl.startsWith('data:')) return
  if (!supabase || !imageUrl.includes(BUCKET)) return

  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return

  const path = imageUrl.slice(index + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}
