import type { Can } from '../types/can'
import type { CollectionSetName, CollectionSetProgress } from '../types/collectionSet'
import { COLLECTION_SETS } from '../types/collectionSet'
import type { MasterCan } from '../types/masterCan'
import { isMasterCanOwned } from './masterCanMatching'

export function inferCollectionSet(master: MasterCan): CollectionSetName {
  const explicit = master.collection_set?.trim()
  if (explicit && COLLECTION_SETS.includes(explicit as CollectionSetName)) {
    return explicit as CollectionSetName
  }

  const haystack = `${master.product_name} ${master.category ?? ''} ${master.flavor ?? ''}`.toLowerCase()

  if (haystack.includes('ultra')) return 'Ultra'
  if (haystack.includes('java')) return 'Java'
  if (haystack.includes('juice') || haystack.includes('pipeline') || haystack.includes('mango loco')) {
    return 'Juice'
  }
  if (haystack.includes('rehab') || haystack.includes('tea')) return 'Rehab'
  if (haystack.includes('nitro')) return 'Nitro'
  if (haystack.includes('reserve')) return 'Reserve'
  if (haystack.includes('punch')) return 'Punch'
  if (haystack.includes('zero sugar') || haystack.includes('zero')) return 'Zero Sugar'
  if (haystack.includes('original') || haystack.includes('classic')) return 'Original'

  return 'Other'
}

export function getMasterCollectionSet(master: MasterCan): CollectionSetName {
  return inferCollectionSet(master)
}

export function computeCollectionSetProgress(
  masters: MasterCan[],
  userCans: Can[],
): CollectionSetProgress[] {
  const active = masters.filter((m) => m.active !== false)
  const bySet = new Map<CollectionSetName, { owned: number; total: number }>()

  for (const set of COLLECTION_SETS) {
    bySet.set(set, { owned: 0, total: 0 })
  }

  for (const master of active) {
    const set = getMasterCollectionSet(master)
    const bucket = bySet.get(set)!
    bucket.total++
    if (isMasterCanOwned(master, userCans)) bucket.owned++
  }

  return COLLECTION_SETS.map((set) => {
    const { owned, total } = bySet.get(set)!
    const missing = Math.max(0, total - owned)
    const percentage = total > 0 ? Math.round((owned / total) * 100) : 0
    return { set, owned, total, percentage, missing }
  }).filter((row) => row.total > 0)
}
