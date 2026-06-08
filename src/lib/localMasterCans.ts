import { MASTER_CANS_SEED } from '../data/masterCansSeed'
import type { MasterCan } from '../types/masterCan'
import { mergeMasterCans, normalizeMasterCan } from './masterCanNormalize'
import { generateId } from './id'

const KEY = 'cancollector-local-master-cans'

function readExtras(): MasterCan[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return (JSON.parse(raw) as MasterCan[]).map((c) => normalizeMasterCan(c))
  } catch {
    return []
  }
}

function writeExtras(cans: MasterCan[]): void {
  localStorage.setItem(KEY, JSON.stringify(cans))
}

export function getLocalMasterCansMerged(): MasterCan[] {
  return mergeMasterCans(
    MASTER_CANS_SEED.map((c) => normalizeMasterCan(c)),
    readExtras(),
  )
}

export async function fetchLocalMasterCans(): Promise<MasterCan[]> {
  return getLocalMasterCansMerged()
}

export function findLocalMasterByBarcode(barcode: string): MasterCan | null {
  const code = barcode.trim()
  if (!code) return null
  return getLocalMasterCansMerged().find((m) => (m.barcode ?? '').trim() === code) ?? null
}

export function findLocalMasterBySourceUrl(sourceUrl: string): MasterCan | null {
  const url = sourceUrl.trim()
  if (!url) return null
  return getLocalMasterCansMerged().find((m) => (m.source_url ?? '').trim() === url) ?? null
}

export function findLocalMasterByNameBrand(brand: string, productName: string): MasterCan | null {
  const b = brand.trim().toLowerCase()
  const n = productName.trim().toLowerCase()
  if (!b || !n) return null
  return (
    getLocalMasterCansMerged().find(
      (m) =>
        (m.brand ?? '').trim().toLowerCase() === b &&
        (m.product_name ?? '').trim().toLowerCase() === n,
    ) ?? null
  )
}

export function findLocalExistingMaster(options: {
  barcode: string | null
  sourceUrl: string | null
  brand: string
  product_name: string
}): MasterCan | null {
  if (options.barcode) {
    const byBarcode = findLocalMasterByBarcode(options.barcode)
    if (byBarcode) return byBarcode
  }
  if (options.sourceUrl) {
    const byUrl = findLocalMasterBySourceUrl(options.sourceUrl)
    if (byUrl) return byUrl
  }
  return findLocalMasterByNameBrand(options.brand, options.product_name)
}

/** Admin approval only — users cannot call this directly from UI. */
export async function upsertLocalApprovedMasterCan(
  input: Omit<MasterCan, 'created_at' | 'updated_at'>,
): Promise<MasterCan> {
  const barcode = (input.barcode ?? '').trim()
  const sourceUrl = (input.source_url ?? '').trim() || null

  const existing = findLocalExistingMaster({
    barcode: barcode || null,
    sourceUrl,
    brand: input.brand,
    product_name: input.product_name,
  })

  if (existing) {
    const extras = readExtras()
    const existingIndex = extras.findIndex((m) => m.id === existing.id)
    const now = new Date().toISOString()
    const row = normalizeMasterCan({
      ...input,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: now,
      active: true,
      source_url: sourceUrl ?? existing.source_url ?? null,
    })
    if (existingIndex >= 0) {
      extras[existingIndex] = row
      writeExtras(extras)
    }
    return row
  }

  const seedMatch = barcode
    ? MASTER_CANS_SEED.find((m) => (m.barcode ?? '').trim() === barcode)
    : null
  if (seedMatch) {
    return normalizeMasterCan(seedMatch)
  }

  const extras = readExtras()
  const existingIndex = -1
  const now = new Date().toISOString()
  const row = normalizeMasterCan({
    ...input,
    id: existingIndex >= 0 ? extras[existingIndex].id : input.id || generateId(),
    created_at: existingIndex >= 0 ? extras[existingIndex].created_at : now,
    updated_at: now,
    active: true,
  })

  if (existingIndex >= 0) {
    extras[existingIndex] = row
    writeExtras(extras)
  } else {
    writeExtras([row, ...extras])
  }

  return row
}
