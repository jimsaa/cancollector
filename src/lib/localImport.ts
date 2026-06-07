import type { Can, CanInsert } from '../types/can'
import { createCan, fetchCans, updateCan } from './cans'
import { findDuplicateCan, normalizeKey } from './duplicates'
import { getAllLocalCans } from './localCans'

const IMPORT_STATUS_KEY = 'cancollector-import-status'

export type ImportStatus = 'pending' | 'completed' | 'skipped'

export interface LocalImportResult {
  total: number
  imported: number
  merged: number
  skipped: number
}

function importStatusKey(userId: string): string {
  return `${IMPORT_STATUS_KEY}-${userId}`
}

export function getImportStatus(userId: string): ImportStatus | null {
  try {
    const raw = localStorage.getItem(importStatusKey(userId))
    if (raw === 'completed' || raw === 'skipped') return raw
    return null
  } catch {
    return null
  }
}

export function setImportStatus(userId: string, status: ImportStatus): void {
  try {
    localStorage.setItem(importStatusKey(userId), status)
  } catch {
    // ignore
  }
}

export function shouldPromptLocalImport(userId: string): boolean {
  const cans = getAllLocalCans()
  if (cans.length === 0) return false
  const status = getImportStatus(userId)
  return status !== 'completed' && status !== 'skipped'
}

function findWishlistDuplicate(
  cans: Can[],
  barcode: string,
  country?: string | null,
  countryVariant?: string | null,
): Can | null {
  const code = barcode.trim()
  if (!code) return null

  const countryKey = normalizeKey(country)
  const variantKey = normalizeKey(countryVariant)

  return (
    cans.find(
      (c) =>
        c.is_wishlist &&
        c.barcode?.trim() === code &&
        normalizeKey(c.country) === countryKey &&
        normalizeKey(c.country_variant) === variantKey,
    ) ?? null
  )
}

function toCanInsert(can: Can): CanInsert {
  const { id: _id, user_id: _uid, added_date: _added, ...rest } = can
  return rest
}

export async function importLocalCollectionToCloud(userId: string): Promise<LocalImportResult> {
  const localCans = getAllLocalCans()
  let cloudCans = await fetchCans(userId)

  let imported = 0
  let merged = 0
  let skipped = 0

  for (const local of localCans) {
    const barcode = local.barcode?.trim() ?? ''

    if (local.is_wishlist && barcode) {
      const wishDup = findWishlistDuplicate(
        cloudCans,
        barcode,
        local.country,
        local.country_variant,
      )
      if (wishDup) {
        skipped++
        continue
      }
    } else if (barcode) {
      const dup = findDuplicateCan(cloudCans, barcode, local.country, local.country_variant)
      if (dup) {
        await updateCan(dup.id, { quantity: dup.quantity + local.quantity })
        merged++
        cloudCans = cloudCans.map((c) =>
          c.id === dup.id ? { ...c, quantity: dup.quantity + local.quantity } : c,
        )
        continue
      }
    }

    const created = await createCan(userId, toCanInsert(local))
    imported++
    cloudCans = [created, ...cloudCans]
  }

  setImportStatus(userId, 'completed')

  return {
    total: localCans.length,
    imported,
    merged,
    skipped,
  }
}
