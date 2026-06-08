import type { MasterCan } from '../types/masterCan'
import { getMasterCollectionSet } from './collectionSets'

export function buildCollectorSummaryFallback(master: MasterCan): string {
  const set = getMasterCollectionSet(master)
  const country =
    master.variant_country?.trim() ||
    master.country?.trim() ||
    master.variant_region?.trim() ||
    'unknown region'

  return `${master.product_name} is a ${set} can from ${country}. It is marked as ${master.rarity} among collectors.`
}

export function getCollectorSummary(master: MasterCan): string {
  const custom = master.collector_summary?.trim()
  return custom || buildCollectorSummaryFallback(master)
}
