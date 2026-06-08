import type { MasterCan } from '../types/masterCan'

import type { MasterImageSource } from '../types/masterImageSource'

import {

  normalizeReferenceImageStatus,

  resolveReferenceImageStatus,

} from '../types/referenceImageStatus'

import { getDefaultPlaceholderImageUrl } from './appSettings'



type MasterImageFields = Pick<

  MasterCan,

  | 'reference_image_url'

  | 'image_url'

  | 'image_source'

  | 'source_url'

  | 'reference_image_status'

  | 'off_preview_image_url'

> & {

  /** Legacy DB column — mapped to reference_image_status on read. */

  reference_image_approved?: boolean | null

}



export function getMasterReferenceImageUrl(master: MasterImageFields): string | null {

  const url = master.reference_image_url?.trim() || master.image_url?.trim()

  return url || null

}



export function isApprovedMasterReference(master: MasterImageFields): boolean {

  const status = normalizeReferenceImageStatus(

    master.reference_image_status,

    master.reference_image_approved,

  )

  return status === 'approved' && Boolean(getMasterReferenceImageUrl(master))

}



export function getApprovedMasterReferenceImageUrl(master: MasterImageFields): string | null {

  if (!isApprovedMasterReference(master)) return null

  return getMasterReferenceImageUrl(master)

}



export function getMasterReferenceDisplayUrl(master: MasterImageFields): string {

  return getApprovedMasterReferenceImageUrl(master) ?? getDefaultPlaceholderImageUrl()

}



export function getOffPreviewImageUrl(master: MasterImageFields): string | null {

  if (master.off_preview_image_url?.trim()) return master.off_preview_image_url.trim()

  if (master.image_source === 'open_food_facts') {

    return getMasterReferenceImageUrl(master)

  }

  return null

}



export function inferMasterImageSource(master: MasterImageFields): MasterImageSource {

  if (master.image_source) return master.image_source

  if (master.source_url?.includes('monsterenergy.com')) return 'official_site'

  if (getMasterReferenceImageUrl(master)) return 'manual'

  return 'placeholder'

}



export function normalizeMasterReferenceFields<T extends MasterImageFields>(master: T): T {

  const image_source = master.image_source ?? inferMasterImageSource(master)

  let reference_image_url = master.reference_image_url?.trim() || master.image_url?.trim() || null

  let off_preview_image_url = master.off_preview_image_url?.trim() || null



  if (image_source === 'open_food_facts' && reference_image_url && !off_preview_image_url) {

    off_preview_image_url = reference_image_url

    reference_image_url = null

  }



  const reference_image_status =
    master.reference_image_status != null
      ? normalizeReferenceImageStatus(master.reference_image_status, master.reference_image_approved)
      : resolveReferenceImageStatus(image_source, reference_image_url, null)

  return {
    ...master,
    reference_image_url,
    off_preview_image_url,
    image_url: reference_image_url,
    image_source,
    reference_image_status,
  }

}


