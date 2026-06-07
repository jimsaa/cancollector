import type { Can } from '../types/can'
import type { ImageSource } from '../types/imageSource'
import placeholderCanUrl from '../assets/placeholder-can.svg'

export type { ImageSource } from '../types/imageSource'
export { IMAGE_SOURCE_LABELS } from '../types/imageSource'

export const PLACEHOLDER_CAN_IMAGE = placeholderCanUrl

export interface ImageCandidates {
  user_image_url?: string | null
  master_image_url?: string | null
  off_image_url?: string | null
}

export interface ResolvedCanImage {
  image_url: string | null
  image_source: ImageSource
}

export function isUserUploadedImage(url: string | null | undefined): boolean {
  if (!url) return false
  if (url.startsWith('data:')) return true
  return url.includes('/can-images/')
}

export function getDefaultProductSource(candidates: ImageCandidates): ImageSource {
  if (candidates.master_image_url?.trim()) return 'master_database'
  if (candidates.off_image_url?.trim()) return 'open_food_facts'
  return 'placeholder'
}

export function resolveCanImage(source: ImageSource, candidates: ImageCandidates): ResolvedCanImage {
  switch (source) {
    case 'user': {
      const url = candidates.user_image_url?.trim()
      if (url) return { image_url: url, image_source: 'user' }
      return resolveCanImage(getDefaultProductSource(candidates), candidates)
    }
    case 'master_database': {
      const url = candidates.master_image_url?.trim()
      if (url) return { image_url: url, image_source: 'master_database' }
      return resolveCanImage(getDefaultProductSource(candidates), candidates)
    }
    case 'open_food_facts': {
      const url = candidates.off_image_url?.trim()
      if (url) return { image_url: url, image_source: 'open_food_facts' }
      return resolveCanImage('placeholder', candidates)
    }
    case 'placeholder':
    default:
      return { image_url: PLACEHOLDER_CAN_IMAGE, image_source: 'placeholder' }
  }
}

/** Automatic selection: user photo wins, then master DB, OFF front, placeholder. */
export function resolveAutoImage(candidates: ImageCandidates): ResolvedCanImage {
  if (candidates.user_image_url?.trim()) {
    return resolveCanImage('user', candidates)
  }
  return resolveCanImage(getDefaultProductSource(candidates), candidates)
}

export function inferImageSourceFromLegacy(can: Partial<Can>): ImageSource {
  if (!can.image_url) return 'placeholder'
  if (isUserUploadedImage(can.image_url)) return 'user'
  if (can.image_url.includes('openfoodfacts.org')) return 'open_food_facts'
  if (can.master_can_id) return 'master_database'
  if (can.image_url === PLACEHOLDER_CAN_IMAGE || can.image_url.endsWith('placeholder-can.svg')) {
    return 'placeholder'
  }
  return 'open_food_facts'
}

export function normalizeCanImageFields(can: Can): Can {
  const image_source = can.image_source ?? inferImageSourceFromLegacy(can)

  let user_image_url = can.user_image_url ?? null
  if (!user_image_url && image_source === 'user' && can.image_url) {
    user_image_url = can.image_url
  }

  let off_image_url = can.off_image_url ?? null
  if (!off_image_url && image_source === 'open_food_facts' && can.image_url) {
    off_image_url = can.image_url
  }

  let master_image_url = can.master_image_url ?? null
  if (!master_image_url && image_source === 'master_database' && can.image_url) {
    master_image_url = can.image_url
  }

  const resolved = resolveCanImage(image_source, {
    user_image_url,
    master_image_url,
    off_image_url,
  })

  return {
    ...can,
    image_source: resolved.image_source,
    image_url: resolved.image_url,
    user_image_url,
    master_image_url,
    off_image_url,
  }
}

export function getDisplayImageUrl(data: {
  image_source?: ImageSource
  user_image_url?: string
  master_image_url?: string
  off_image_url?: string
}): string | null {
  const source = data.image_source ?? resolveAutoImage({
    user_image_url: data.user_image_url,
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  }).image_source

  return resolveCanImage(source, {
    user_image_url: data.user_image_url,
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  }).image_url
}

export function getSaveImageFields(data: {
  image_source: ImageSource
  user_image_url?: string
  master_image_url?: string
  off_image_url?: string
}): Pick<Can, 'image_url' | 'image_source' | 'user_image_url' | 'master_image_url' | 'off_image_url'> {
  const user_image_url = data.user_image_url?.trim() || null
  const master_image_url = data.master_image_url?.trim() || null
  const off_image_url = data.off_image_url?.trim() || null
  const resolved = resolveCanImage(data.image_source, {
    user_image_url,
    master_image_url,
    off_image_url,
  })

  return {
    image_url: resolved.image_url,
    image_source: resolved.image_source,
    user_image_url,
    master_image_url,
    off_image_url,
  }
}

/** Reference/catalog image for collection grids and completion views (not user photos). */
export function getReferenceImageUrl(candidates: ImageCandidates): string | null {
  return candidates.master_image_url?.trim() || candidates.off_image_url?.trim() || null
}

export function getUserCanImageUrl(candidates: ImageCandidates): string | null {
  return candidates.user_image_url?.trim() || null
}

export function getCollectionDisplayImageUrl(candidates: ImageCandidates): string {
  const reference = getReferenceImageUrl(candidates)
  if (reference) return reference
  return PLACEHOLDER_CAN_IMAGE
}

/** Trade listings prefer the collector's own photo when available. */
export function getTradeDisplayImageUrl(candidates: ImageCandidates): string {
  const user = getUserCanImageUrl(candidates)
  if (user) return user
  const reference = getReferenceImageUrl(candidates)
  if (reference) return reference
  return PLACEHOLDER_CAN_IMAGE
}

/** @deprecated Use getSaveImageFields */
export function getSaveImageUrl(data: {
  user_image_url?: string
  off_image_url?: string
  api_image_url?: string
}): string | null {
  const resolved = resolveAutoImage({
    user_image_url: data.user_image_url,
    off_image_url: data.off_image_url ?? data.api_image_url,
  })
  return resolved.image_url
}
