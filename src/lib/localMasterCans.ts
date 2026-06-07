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

/** Admin approval only — users cannot call this directly from UI. */
export async function upsertLocalApprovedMasterCan(
  input: Omit<MasterCan, 'created_at' | 'updated_at'>,
): Promise<MasterCan> {
  const barcode = (input.barcode ?? '').trim()
  const sourceUrl = (input.source_url ?? '').trim()

  if (sourceUrl) {
    const byUrl = findLocalMasterBySourceUrl(sourceUrl)
    if (byUrl) {
      const extras = readExtras()
      const existingIndex = extras.findIndex((m) => m.id === byUrl.id)
      const now = new Date().toISOString()
      const row = normalizeMasterCan({
        ...input,
        id: byUrl.id,
        created_at: byUrl.created_at,
        updated_at: now,
        active: true,
      })
      if (existingIndex >= 0) {
        extras[existingIndex] = row
        writeExtras(extras)
      }
      return row
    }
  }

  const seedMatch = barcode
    ? MASTER_CANS_SEED.find((m) => (m.barcode ?? '').trim() === barcode)
    : null
  if (seedMatch) {
    return normalizeMasterCan(seedMatch)
  }

  const extras = readExtras()
  const existingIndex = barcode
    ? extras.findIndex((m) => (m.barcode ?? '').trim() === barcode)
    : sourceUrl
      ? extras.findIndex((m) => (m.source_url ?? '').trim() === sourceUrl)
      : -1
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
