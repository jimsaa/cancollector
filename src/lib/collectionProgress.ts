import type { Can } from '../types/can'
import type { CollectionProgress, MasterBrandFilter, MasterCan } from '../types/masterCan'
import { isMasterCanOwned } from './masterCanMatching'

export function filterMasterCansByBrand(
  masters: MasterCan[],
  brand: MasterBrandFilter,
): MasterCan[] {
  if (brand === 'all') return masters
  return masters.filter((m) => m.brand === brand)
}

export function computeCollectionProgress(
  masters: MasterCan[],
  userCans: Can[],
  brand: MasterBrandFilter = 'all',
): CollectionProgress {
  const scoped = filterMasterCansByBrand(
    masters.filter((m) => m.active),
    brand,
  )

  const owned = scoped.filter((master) => isMasterCanOwned(master, userCans)).length
  const total = scoped.length
  const percentage = total === 0 ? 0 : Math.round((owned / total) * 1000) / 10

  return {
    owned,
    total,
    percentage,
    missing: total - owned,
  }
}

export function formatProgressLabel(progress: CollectionProgress): string {
  return `${progress.owned} / ${progress.total}`
}

export function formatProgressPercent(progress: CollectionProgress): string {
  return `${Math.round(progress.percentage)}% complete`
}
