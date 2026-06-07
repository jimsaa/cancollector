import type { Can, CollectionBackup } from '../types/can'
import { generateId } from './id'

const BACKUP_VERSION = 1 as const

export function exportCollectionToJson(cans: Can[]): string {
  const backup: CollectionBackup = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    cans,
  }
  return JSON.stringify(backup, null, 2)
}

export function downloadCollectionBackup(cans: Can[], filename?: string): void {
  const json = exportCollectionToJson(cans)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename ?? `cancollector-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function normalizeImportedCan(raw: Partial<Can>, userId: string): Can {
  return {
    id: raw.id ?? generateId(),
    user_id: userId,
    barcode: raw.barcode ?? null,
    name: raw.name ?? null,
    brand: raw.brand ?? null,
    flavor: raw.flavor ?? null,
    volume: raw.volume ?? null,
    country: raw.country ?? null,
    country_variant: raw.country_variant ?? null,
    image_url: raw.image_url ?? null,
    opened: raw.opened ?? false,
    purchase_date: raw.purchase_date ?? null,
    added_date: raw.added_date ?? new Date().toISOString(),
    available_for_trade: raw.available_for_trade ?? false,
    notes: raw.notes ?? null,
    rarity: raw.rarity ?? 'unknown',
    quantity: Math.max(1, raw.quantity ?? 1),
    is_wishlist: raw.is_wishlist ?? false,
    wishlist_status: raw.wishlist_status ?? null,
  }
}

export function parseCollectionBackup(json: string, userId: string): Can[] {
  const parsed = JSON.parse(json) as CollectionBackup | Can[]

  const items = Array.isArray(parsed) ? parsed : parsed.cans
  if (!Array.isArray(items)) {
    throw new Error('Invalid backup file — expected a cans array')
  }

  return items.map((item) => normalizeImportedCan(item, userId))
}
