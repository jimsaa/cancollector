import type { MasterCan } from '../types/masterCan'

import type { MasterImageSource } from '../types/masterImageSource'

import type { ReferenceImageStatus } from '../types/referenceImageStatus'



export interface MasterReferencePayload {

  reference_image_url: string | null

  off_preview_image_url: string | null

  image_source: MasterImageSource

  reference_image_status: ReferenceImageStatus

}



function isOpenFoodFactsUrl(url: string | null | undefined): boolean {

  return Boolean(url?.includes('openfoodfacts.org'))

}



/** Never auto-approve Open Food Facts images as catalog references. */

export function buildMasterReferencePayload(input: {

  reference_image_url?: string | null

  image_url?: string | null

  image_source?: MasterImageSource | null

  source?: string | null

  /** Admin explicitly approved this master entry. */

  adminApproved?: boolean

}): MasterReferencePayload {

  const rawUrl = input.reference_image_url?.trim() || input.image_url?.trim() || null

  const image_source: MasterImageSource =

    input.image_source ??

    (input.source === 'official_site'

      ? 'official_site'

      : isOpenFoodFactsUrl(rawUrl)

        ? 'open_food_facts'

        : rawUrl

          ? 'manual'

          : 'placeholder')



  const isOff =

    image_source === 'open_food_facts' ||

    input.source === 'open_food_facts' ||

    isOpenFoodFactsUrl(rawUrl)



  if (isOff && !(input.adminApproved && input.image_source === 'manual')) {
    return {
      reference_image_url: null,
      off_preview_image_url: rawUrl,
      image_source: 'open_food_facts',
      reference_image_status: 'pending',
    }
  }



  if (!rawUrl) {

    return {

      reference_image_url: null,

      off_preview_image_url: null,

      image_source: 'placeholder',

      reference_image_status: 'placeholder',

    }

  }



  const reference_image_status: ReferenceImageStatus = input.adminApproved

    ? 'approved'

    : image_source === 'official_site' || image_source === 'manual' || image_source === 'seed'

      ? 'approved'

      : 'pending'



  return {

    reference_image_url: rawUrl,

    off_preview_image_url: null,

    image_source,

    reference_image_status,

  }

}



export function toMasterCanReferenceFields(

  payload: MasterReferencePayload,

): Pick<

  MasterCan,

  'reference_image_url' | 'off_preview_image_url' | 'image_source' | 'reference_image_status' | 'image_url'

> {

  return {

    reference_image_url: payload.reference_image_url,

    image_url: payload.reference_image_url,

    off_preview_image_url: payload.off_preview_image_url,

    image_source: payload.image_source,

    reference_image_status: payload.reference_image_status,

  }

}


