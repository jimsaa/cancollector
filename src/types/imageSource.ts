export type ImageSource =

  | 'user_uploaded'

  | 'master_reference'

  | 'default_placeholder'

  | 'open_food_facts_unverified'



/** Legacy DB / backup values mapped on read. */

const LEGACY_IMAGE_SOURCE_MAP: Record<string, ImageSource> = {

  user: 'user_uploaded',

  master_database: 'master_reference',

  placeholder: 'default_placeholder',

  open_food_facts: 'open_food_facts_unverified',

}



export const IMAGE_SOURCES: ImageSource[] = [

  'user_uploaded',

  'master_reference',

  'default_placeholder',

  'open_food_facts_unverified',

]



export const IMAGE_SOURCE_LABELS: Record<ImageSource, string> = {

  user_uploaded: 'Your photo',

  master_reference: 'Master reference',

  default_placeholder: 'Default placeholder',

  open_food_facts_unverified: 'Barcode lookup (unverified)',

}



export function normalizeImageSource(value: string | null | undefined): ImageSource {

  if (!value) return 'default_placeholder'

  if (IMAGE_SOURCES.includes(value as ImageSource)) return value as ImageSource

  return LEGACY_IMAGE_SOURCE_MAP[value] ?? 'default_placeholder'

}


