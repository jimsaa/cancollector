import type { MasterCan } from '../types/masterCan'
import type { MasterImageSource } from '../types/masterImageSource'
import { PLACEHOLDER_CAN_IMAGE } from './canImage'

type MasterImageFields = Pick<MasterCan, 'reference_image_url' | 'image_url' | 'image_source' | 'source_url'>

export function getMasterReferenceImageUrl(master: MasterImageFields): string | null {
  const url = master.reference_image_url?.trim() || master.image_url?.trim()
  return url || null
}

export function getMasterReferenceDisplayUrl(master: MasterImageFields): string {
  return getMasterReferenceImageUrl(master) ?? PLACEHOLDER_CAN_IMAGE
}

export function inferMasterImageSource(master: MasterImageFields): MasterImageSource {
  if (master.image_source) return master.image_source
  if (master.source_url?.includes('monsterenergy.com')) return 'official_site'
  if (getMasterReferenceImageUrl(master)) return 'manual'
  return 'placeholder'
}

export function normalizeMasterReferenceFields<T extends MasterImageFields>(master: T): T {
  const reference_image_url = master.reference_image_url?.trim() || master.image_url?.trim() || null
  const image_source = master.image_source ?? inferMasterImageSource(master)
  return {
    ...master,
    reference_image_url,
    image_url: reference_image_url,
    image_source,
  }
}
