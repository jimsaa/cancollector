import type { Can, CollectionBackup } from '../types/can'
import { normalizeCanCollectorFields } from './canCollectorFields'
import { normalizeCanImageFields } from './canImage'
import { generateId } from './id'

const BACKUP_VERSION = 1 as const
const LAST_BACKUP_KEY_PREFIX = 'cancollector_last_backup_'

export interface BackupPreview {
  collectionCount: number
  wishlistCount: number
  totalQuantity: number
  brands: string[]
}

export function getBackupPreview(cans: Can[]): BackupPreview {
  const collection = cans.filter((c) => !c.is_wishlist)
  const wishlist = cans.filter((c) => c.is_wishlist)
  const brands = [...new Set(collection.map((c) => c.brand).filter(Boolean))] as string[]
  return {
    collectionCount: collection.length,
    wishlistCount: wishlist.length,
    totalQuantity: collection.reduce((sum, c) => sum + c.quantity, 0),
    brands: brands.sort(),
  }
}

export function getLastBackupDate(userId: string): string | null {
  return localStorage.getItem(`${LAST_BACKUP_KEY_PREFIX}${userId}`)
}

export function recordBackupDate(userId: string): void {
  localStorage.setItem(`${LAST_BACKUP_KEY_PREFIX}${userId}`, new Date().toISOString())
}

export function exportCollectionToJson(cans: Can[]): string {
  const backup: CollectionBackup = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    cans,
  }
  return JSON.stringify(backup, null, 2)
}

export function downloadCollectionBackup(
  cans: Can[],
  options?: { filename?: string; userId?: string },
): void {
  const json = exportCollectionToJson(cans)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download =
    options?.filename ?? `cancollector-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  if (options?.userId) recordBackupDate(options.userId)
}

function normalizeImportedCan(raw: Partial<Can>, userId: string): Can {
  return normalizeCanCollectorFields(
    normalizeCanImageFields({
    id: raw.id ?? generateId(),
    user_id: userId,
    master_can_id: raw.master_can_id ?? null,
    barcode: raw.barcode ?? null,
    name: raw.name ?? null,
    brand: raw.brand ?? null,
    flavor: raw.flavor ?? null,
    volume: raw.volume ?? null,
    country: raw.country ?? null,
    country_variant: raw.country_variant ?? null,
    image_url: raw.image_url ?? null,
    image_source: raw.image_source ?? 'placeholder',
    user_image_url: raw.user_image_url ?? null,
    master_image_url: raw.master_image_url ?? null,
    off_image_url: raw.off_image_url ?? null,
    opened: raw.opened ?? false,
    purchase_date: raw.purchase_date ?? null,
    added_date: raw.added_date ?? new Date().toISOString(),
    available_for_trade: raw.available_for_trade ?? false,
    wanted: raw.wanted ?? false,
    notes: raw.notes ?? null,
    rarity: raw.rarity ?? 'unknown',
    quantity: Math.max(1, raw.quantity ?? 1),
    is_wishlist: raw.is_wishlist ?? false,
    wishlist_status: raw.wishlist_status ?? null,
    purchase_country: raw.purchase_country ?? null,
    purchase_city: raw.purchase_city ?? null,
    purchase_store: raw.purchase_store ?? null,
    trade_price: raw.trade_price ?? null,
    trade_currency: raw.trade_currency ?? null,
    trade_note: raw.trade_note ?? null,
    is_public: raw.is_public ?? false,
    show_on_public_profile: raw.show_on_public_profile ?? false,
    condition_notes: raw.condition_notes ?? null,
    } as Can),
  )
}

export function parseCollectionBackup(json: string, userId: string): Can[] {
  const parsed = JSON.parse(json) as CollectionBackup | Can[]

  const items = Array.isArray(parsed) ? parsed : parsed.cans
  if (!Array.isArray(items)) {
    throw new Error('Invalid backup file — expected a cans array')
  }

  return items.map((item) => normalizeImportedCan(item, userId))
}
