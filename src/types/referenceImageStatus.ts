export type ReferenceImageStatus = 'pending' | 'approved' | 'rejected' | 'placeholder'



export const REFERENCE_IMAGE_STATUSES: ReferenceImageStatus[] = [

  'pending',

  'approved',

  'rejected',

  'placeholder',

]



export const REFERENCE_IMAGE_STATUS_LABELS: Record<ReferenceImageStatus, string> = {

  pending: 'Pending review',

  approved: 'Approved',

  rejected: 'Rejected',

  placeholder: 'Placeholder',

}



export function normalizeReferenceImageStatus(

  value: string | null | undefined,

  legacyApproved?: boolean | null,

): ReferenceImageStatus {

  if (value && REFERENCE_IMAGE_STATUSES.includes(value as ReferenceImageStatus)) {

    return value as ReferenceImageStatus

  }

  if (legacyApproved === true) return 'approved'

  if (legacyApproved === false) return 'placeholder'

  return 'placeholder'

}



export function resolveReferenceImageStatus(

  imageSource: string | null | undefined,

  referenceImageUrl: string | null | undefined,

  explicit?: ReferenceImageStatus | null,

): ReferenceImageStatus {

  if (explicit) return explicit

  const url = referenceImageUrl?.trim()

  if (!url) return 'placeholder'

  if (imageSource === 'open_food_facts') return 'pending'

  if (
    imageSource === 'official_site' ||
    imageSource === 'manual' ||
    imageSource === 'admin_uploaded' ||
    imageSource === 'seed'
  ) {
    return 'approved'
  }

  return 'pending'

}


