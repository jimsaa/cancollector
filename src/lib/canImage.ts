import type { Can } from '../types/can'

import type { ImageSource } from '../types/imageSource'

import { getDefaultPlaceholderImageUrl } from './appSettings'

import { normalizeImageSource } from '../types/imageSource'



export type { ImageSource } from '../types/imageSource'

export { IMAGE_SOURCE_LABELS, IMAGE_SOURCES, normalizeImageSource } from '../types/imageSource'



export const PLACEHOLDER_CAN_IMAGE = getDefaultPlaceholderImageUrl()



export interface ImageCandidates {

  user_image_url?: string | null

  master_image_url?: string | null

  off_image_url?: string | null

  /** When false, master_image_url is stored but not used for display until approved. */

  master_reference_approved?: boolean

}



export interface ResolvedCanImage {

  image_url: string | null

  image_source: ImageSource

}



export function isOpenFoodFactsUrl(url: string | null | undefined): boolean {
  return Boolean(url?.includes('openfoodfacts.org'))
}

export function isUserUploadedImage(url: string | null | undefined): boolean {

  if (!url) return false

  if (url.startsWith('data:')) return true

  return url.includes('/can-images/')

}



/** Collection image after scan — never OFF; user → approved master → placeholder. */

export function getDefaultCollectionSource(candidates: ImageCandidates): ImageSource {

  if (candidates.user_image_url?.trim()) return 'user_uploaded'

  if (candidates.master_image_url?.trim() && candidates.master_reference_approved !== false) {

    return 'master_reference'

  }

  if (candidates.master_image_url?.trim() && candidates.master_reference_approved === false) {

    return 'default_placeholder'

  }

  return 'default_placeholder'

}



/** @deprecated Use getDefaultCollectionSource */

export function getDefaultProductSource(candidates: ImageCandidates): ImageSource {

  return getDefaultCollectionSource(candidates)

}



export function resolveCanImage(source: ImageSource, candidates: ImageCandidates): ResolvedCanImage {

  const normalized = normalizeImageSource(source)



  switch (normalized) {

    case 'user_uploaded': {

      const url = candidates.user_image_url?.trim()

      if (url) return { image_url: url, image_source: 'user_uploaded' }

      return resolveCanImage(getDefaultCollectionSource(candidates), candidates)

    }

    case 'master_reference': {

      const url = candidates.master_image_url?.trim()

      if (url && candidates.master_reference_approved !== false) {

        return { image_url: url, image_source: 'master_reference' }

      }

      return resolveCanImage('default_placeholder', candidates)

    }

    case 'open_food_facts_unverified': {

      const url = candidates.off_image_url?.trim()

      if (url) return { image_url: url, image_source: 'open_food_facts_unverified' }

      return resolveCanImage('default_placeholder', candidates)

    }

    case 'default_placeholder':

    default:

      return { image_url: getDefaultPlaceholderImageUrl(), image_source: 'default_placeholder' }

  }

}



/** After barcode scan: default to placeholder, not OFF. */

export function resolveScanDefaultImage(candidates: ImageCandidates): ResolvedCanImage {

  return resolveCanImage(getDefaultCollectionSource(candidates), candidates)

}



/** @deprecated Use resolveScanDefaultImage for wizard defaults */

export function resolveAutoImage(candidates: ImageCandidates): ResolvedCanImage {

  return resolveScanDefaultImage(candidates)

}



export function inferImageSourceFromLegacy(can: Partial<Can>): ImageSource {

  if (can.image_source) return normalizeImageSource(can.image_source)

  if (!can.image_url) return 'default_placeholder'

  if (isUserUploadedImage(can.image_url)) return 'user_uploaded'

  if (can.image_url.includes('openfoodfacts.org')) return 'open_food_facts_unverified'

  if (can.master_can_id) return 'master_reference'

  const placeholder = getDefaultPlaceholderImageUrl()

  if (can.image_url === placeholder || can.image_url.endsWith('placeholder-can.svg')) {

    return 'default_placeholder'

  }

  return 'open_food_facts_unverified'

}



export function normalizeCanImageFields(can: Can): Can {

  const image_source = inferImageSourceFromLegacy(can)



  let user_image_url = can.user_image_url ?? null

  if (!user_image_url && image_source === 'user_uploaded' && can.image_url) {

    user_image_url = can.image_url

  }



  let off_image_url = can.off_image_url ?? null

  if (!off_image_url && image_source === 'open_food_facts_unverified' && can.image_url) {

    off_image_url = can.image_url

  }



  let master_image_url = can.master_image_url ?? null

  if (!master_image_url && image_source === 'master_reference' && can.image_url) {

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

  image_source?: ImageSource | string

  user_image_url?: string

  master_image_url?: string

  off_image_url?: string

  master_reference_approved?: boolean

}): string | null {

  const source = data.image_source

    ? normalizeImageSource(data.image_source)

    : resolveScanDefaultImage({

        user_image_url: data.user_image_url,

        master_image_url: data.master_image_url,

        off_image_url: data.off_image_url,

        master_reference_approved: data.master_reference_approved,

      }).image_source



  return resolveCanImage(source, {

    user_image_url: data.user_image_url,

    master_image_url: data.master_image_url,

    off_image_url: data.off_image_url,

    master_reference_approved: data.master_reference_approved,

  }).image_url

}



/** OFF lookup preview only — not used as collection image by default. */

export function getOffLookupPreviewUrl(off_image_url?: string | null): string | null {

  return off_image_url?.trim() || null

}



export function getSaveImageFields(data: {

  image_source: ImageSource | string

  user_image_url?: string

  master_image_url?: string

  off_image_url?: string

  master_reference_approved?: boolean

}): Pick<Can, 'image_url' | 'image_source' | 'user_image_url' | 'master_image_url' | 'off_image_url'> {

  const user_image_url = data.user_image_url?.trim() || null

  const master_image_url = data.master_image_url?.trim() || null

  const off_image_url = data.off_image_url?.trim() || null

  const resolved = resolveCanImage(normalizeImageSource(data.image_source), {

    user_image_url,

    master_image_url,

    off_image_url,

    master_reference_approved: data.master_reference_approved,

  })



  return {

    image_url: resolved.image_url,

    image_source: resolved.image_source,

    user_image_url,

    master_image_url,

    off_image_url,

  }

}



export function getApprovedMasterReferenceUrl(
  candidates: ImageCandidates & { image_source?: ImageSource | string },
): string | null {
  if (candidates.master_reference_approved === false) return null

  const source = candidates.image_source
    ? normalizeImageSource(candidates.image_source)
    : 'master_reference'
  if (source !== 'master_reference') return null

  const master = candidates.master_image_url?.trim()
  if (!master || isOpenFoodFactsUrl(master)) return null
  return master
}



export function getReferenceImageUrl(candidates: ImageCandidates): string | null {
  return getApprovedMasterReferenceUrl(candidates)
}

export function getUserCanImageUrl(candidates: ImageCandidates): string | null {
  return candidates.user_image_url?.trim() || null
}

export function getCollectionDisplayImageUrl(
  candidates: ImageCandidates & { image_source?: ImageSource | string },
): string {
  const user = candidates.user_image_url?.trim()
  if (user) return user
  const master = getApprovedMasterReferenceUrl(candidates)
  if (master) return master
  return getDefaultPlaceholderImageUrl()
}



/** Trade listings: user photo first; never OFF. */

export function getTradeDisplayImageUrl(candidates: ImageCandidates): string {

  const user = candidates.user_image_url?.trim()

  if (user) return user

  const master = getApprovedMasterReferenceUrl(candidates)

  if (master) return master

  return getDefaultPlaceholderImageUrl()

}



/** @deprecated Use getSaveImageFields */

export function getSaveImageUrl(data: {

  user_image_url?: string

  off_image_url?: string

  api_image_url?: string

}): string | null {

  const resolved = resolveScanDefaultImage({

    user_image_url: data.user_image_url,

    off_image_url: data.off_image_url ?? data.api_image_url,

  })

  return resolved.image_url

}


