export const COLLECTION_SETS = [
  'Ultra',
  'Java',
  'Juice',
  'Rehab',
  'Nitro',
  'Reserve',
  'Punch',
  'Original',
  'Zero Sugar',
  'Other',
] as const

export type CollectionSetName = (typeof COLLECTION_SETS)[number]

export interface CollectionSetProgress {
  set: CollectionSetName
  owned: number
  total: number
  percentage: number
  missing: number
}
