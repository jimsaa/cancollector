import type { Can } from '../types/can'
import type { CollectionProgress } from '../types/masterCan'
import { computeStats } from './cans'
import { computeCollectionProgress } from './collectionProgress'
import type { MasterCan } from '../types/masterCan'
import { normalizeKey } from './duplicates'

export interface ChartDatum {
  label: string
  value: number
}

export interface CanHighlight {
  name: string
  date: string
  id: string
}

export interface CollectorStatistics {
  total: number
  opened: number
  unopened: number
  duplicates: number
  tradeCans: number
  countriesRepresented: number
  oldest: CanHighlight | null
  newest: CanHighlight | null
  completionPercentage: number
  completionOwned: number
  completionTotal: number
  byCountry: ChartDatum[]
  byBrand: ChartDatum[]
  growthByMonth: ChartDatum[]
}

function collectionCans(cans: Can[]): Can[] {
  return cans.filter((c) => !c.is_wishlist)
}

/** Extra cans beyond the first copy (quantity > 1). */
export function computeDuplicateExtras(cans: Can[]): number {
  return collectionCans(cans).reduce((sum, c) => sum + Math.max(0, c.quantity - 1), 0)
}

function groupCount(
  items: Can[],
  keyFn: (can: Can) => string,
  emptyLabel = 'Unknown',
): ChartDatum[] {
  const map = new Map<string, number>()

  for (const can of items) {
    const raw = keyFn(can).trim()
    const key = raw || emptyLabel
    map.set(key, (map.get(key) ?? 0) + can.quantity)
  }

  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function computeGrowthByMonth(cans: Can[]): ChartDatum[] {
  const map = new Map<string, number>()

  for (const can of collectionCans(cans)) {
    const d = new Date(can.added_date)
    if (Number.isNaN(d.getTime())) continue
    const key = formatMonthKey(d)
    map.set(key, (map.get(key) ?? 0) + can.quantity)
  }

  const keys = [...map.keys()].sort()
  const recent = keys.slice(-12)

  return recent.map((key) => ({
    label: formatMonthLabel(key),
    value: map.get(key) ?? 0,
  }))
}

function toHighlight(can: Can): CanHighlight {
  return {
    id: can.id,
    name: can.name ?? 'Unknown',
    date: new Date(can.added_date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}

export function computeCollectorStatistics(
  cans: Can[],
  masters: MasterCan[] = [],
): CollectorStatistics {
  const collection = collectionCans(cans)
  const base = computeStats(cans)

  const countries = new Set(
    collection
      .map((c) => normalizeKey(c.country))
      .filter((c) => c.length > 0),
  )

  const sorted = [...collection].sort(
    (a, b) => new Date(a.added_date).getTime() - new Date(b.added_date).getTime(),
  )

  const progress: CollectionProgress = computeCollectionProgress(masters, cans, 'all')

  return {
    total: base.total,
    opened: base.opened,
    unopened: base.unopened,
    duplicates: computeDuplicateExtras(cans),
    tradeCans: base.forTrade,
    countriesRepresented: countries.size,
    oldest: sorted[0] ? toHighlight(sorted[0]) : null,
    newest: sorted[sorted.length - 1] ? toHighlight(sorted[sorted.length - 1]) : null,
    completionPercentage: progress.percentage,
    completionOwned: progress.owned,
    completionTotal: progress.total,
    byCountry: groupCount(collection, (c) => c.country ?? ''),
    byBrand: groupCount(collection, (c) => c.brand ?? ''),
    growthByMonth: computeGrowthByMonth(cans),
  }
}
