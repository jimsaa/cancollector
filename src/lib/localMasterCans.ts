import { MASTER_CANS_SEED } from '../data/masterCansSeed'
import type { MasterBarcodeSource, MasterCan } from '../types/masterCan'
import { pickMasterByProductIdentity } from './masterCanProductMatch'
import { linkUserCansToMasterByBarcode } from './masterCanLink'
import { normalizeMasterBarcode } from './masterCanSupabase'
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

export function findLocalMasterByProductIdentity(
  brand: string,
  productName: string,
  flavor?: string | null,
  category?: string | null,
): MasterCan | null {
  const b = brand.trim().toLowerCase()
  const n = productName.trim().toLowerCase()
  if (!b || !n) return null

  const candidates = getLocalMasterCansMerged().filter(
    (m) =>
      (m.brand ?? '').trim().toLowerCase() === b &&
      (m.product_name ?? '').trim().toLowerCase() === n,
  )

  return pickMasterByProductIdentity(candidates, {
    brand,
    product_name: productName,
    flavor,
    category,
  })
}

export function findLocalExistingMaster(options: {
  barcode: string | null
  sourceUrl: string | null
  brand: string
  product_name: string
  flavor?: string | null
  category?: string | null
}): MasterCan | null {
  if (options.sourceUrl) {
    const byUrl = findLocalMasterBySourceUrl(options.sourceUrl)
    if (byUrl) return byUrl
  }

  const byIdentity = findLocalMasterByProductIdentity(
    options.brand,
    options.product_name,
    options.flavor,
    options.category,
  )
  if (byIdentity) return byIdentity

  if (options.barcode) {
    return findLocalMasterByBarcode(options.barcode)
  }

  return null
}

export async function attachBarcodeToLocalMasterCan(
  masterId: string,
  barcode: string,
  barcodeSource: MasterBarcodeSource,
): Promise<MasterCan> {
  const code = barcode.trim()
  if (!code) throw new Error('Barcode is required')

  const merged = getLocalMasterCansMerged()
  const existing = merged.find((m) => normalizeMasterBarcode(m.barcode) === code)
  if (existing && existing.id !== masterId) {
    throw new Error(`Barcode already linked to ${existing.product_name}`)
  }

  const target = merged.find((m) => m.id === masterId)
  if (!target) throw new Error('Master can not found')

  const now = new Date().toISOString()
  const row = normalizeMasterCan({
    ...target,
    barcode: code,
    barcode_source: barcodeSource,
    updated_at: now,
  })

  const extras = readExtras()
  const seedMatch = MASTER_CANS_SEED.find((m) => m.id === masterId)
  if (seedMatch) {
    writeExtras([row, ...extras.filter((m) => m.id !== masterId)])
    return row
  }

  const index = extras.findIndex((m) => m.id === masterId)
  if (index >= 0) {
    extras[index] = row
    writeExtras(extras)
  } else {
    writeExtras([row, ...extras])
  }

  await linkUserCansToMasterByBarcode(code, masterId)

  return row
}

/** Admin approval only — users cannot call this directly from UI. */
export async function upsertLocalApprovedMasterCan(
  input: Omit<MasterCan, 'created_at' | 'updated_at'>,
): Promise<MasterCan> {
  const barcode = normalizeMasterBarcode(input.barcode)
  const sourceUrl = (input.source_url ?? '').trim() || null

  const existing = findLocalExistingMaster({
    barcode: barcode || null,
    sourceUrl,
    brand: input.brand,
    product_name: input.product_name,
    flavor: input.flavor,
    category: input.category,
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
      barcode,
      source_url: sourceUrl ?? existing.source_url ?? null,
    })
    if (existingIndex >= 0) {
      extras[existingIndex] = row
      writeExtras(extras)
    }
    return row
  }

  const seedMatch = barcode
    ? MASTER_CANS_SEED.find((m) => normalizeMasterBarcode(m.barcode) === barcode)
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
    barcode,
  })

  if (existingIndex >= 0) {
    extras[existingIndex] = row
    writeExtras(extras)
  } else {
    writeExtras([row, ...extras])
  }

  return row
}
