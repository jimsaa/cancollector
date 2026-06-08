import type { Can } from '../types/can'
import { normalizeCanCollectorFields } from './canCollectorFields'
import { normalizeCanImageFields } from './canImage'
import { generateId } from './id'

/** Primary + legacy localStorage keys that may hold guest cans. */
export const GUEST_CAN_STORAGE_KEYS = [
  'cancollector-cans',
  'cans',
  'monster-cans',
  'localCans',
  'collection',
  'monster-collection',
] as const

export interface GuestCanDiscovery {
  cans: Can[]
  keysFound: string[]
  countsByKey: Record<string, number>
}

function looksLikeCan(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    (typeof row.user_id === 'string' ||
      typeof row.name === 'string' ||
      typeof row.barcode === 'string')
  )
}

function extractCanArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed
  if (!parsed || typeof parsed !== 'object') return []

  const record = parsed as Record<string, unknown>
  if (Array.isArray(record.cans)) return record.cans
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.collection)) return record.collection
  if (record.data && Array.isArray((record.data as Record<string, unknown>).cans)) {
    return (record.data as Record<string, unknown>).cans as unknown[]
  }
  return []
}

function normalizeDiscoveredCan(raw: Record<string, unknown>): Can {
  return normalizeCanCollectorFields(
    normalizeCanImageFields({
    id: String(raw.id ?? generateId()),
    user_id: String(raw.user_id ?? 'guest'),
    master_can_id: (raw.master_can_id as string | null) ?? null,
    barcode: (raw.barcode as string | null) ?? null,
    name: (raw.name as string | null) ?? null,
    brand: (raw.brand as string | null) ?? null,
    flavor: (raw.flavor as string | null) ?? null,
    volume: (raw.volume as string | null) ?? null,
    country: (raw.country as string | null) ?? null,
    country_variant: (raw.country_variant as string | null) ?? null,
    image_url: (raw.image_url as string | null) ?? null,
    image_source: (raw.image_source as Can['image_source']) ?? 'default_placeholder',
    user_image_url: (raw.user_image_url as string | null) ?? null,
    master_image_url: (raw.master_image_url as string | null) ?? null,
    off_image_url: (raw.off_image_url as string | null) ?? null,
    opened: Boolean(raw.opened),
    opening_status: (raw.opening_status as Can['opening_status']) ?? undefined,
    purchase_date: (raw.purchase_date as string | null) ?? null,
    purchase_country: (raw.purchase_country as string | null) ?? null,
    purchase_city: (raw.purchase_city as string | null) ?? null,
    purchase_store: (raw.purchase_store as string | null) ?? null,
    added_date: String(raw.added_date ?? new Date().toISOString()),
    trade_status: (raw.trade_status as Can['trade_status']) ?? undefined,
    available_for_trade: Boolean(raw.available_for_trade),
    trade_price: raw.trade_price != null ? Number(raw.trade_price) : null,
    trade_currency: (raw.trade_currency as Can['trade_currency']) ?? null,
    trade_note: (raw.trade_note as string | null) ?? null,
    is_public: Boolean(raw.is_public),
    show_on_public_profile: Boolean(raw.show_on_public_profile),
    condition_grade: (raw.condition_grade as Can['condition_grade']) ?? undefined,
    condition_notes: (raw.condition_notes as string | null) ?? null,
    wanted: Boolean(raw.wanted),
    notes: (raw.notes as string | null) ?? null,
    rarity: (raw.rarity as Can['rarity']) ?? 'unknown',
    quantity: Math.max(1, Number(raw.quantity) || 1),
    is_wishlist: Boolean(raw.is_wishlist),
    wishlist_status: (raw.wishlist_status as Can['wishlist_status']) ?? null,
    }),
  )
}

function parseCansFromStorageValue(raw: string): Can[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    const rows = extractCanArray(parsed)
    return rows.filter(looksLikeCan).map((row) => normalizeDiscoveredCan(row))
  } catch {
    return []
  }
}

/** Scan all known localStorage keys and merge guest cans (dedupe by id). */
export function discoverGuestCans(): GuestCanDiscovery {
  const keysFound: string[] = []
  const countsByKey: Record<string, number> = {}
  const byId = new Map<string, Can>()

  for (const key of GUEST_CAN_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw?.trim()) continue

      const parsed = parseCansFromStorageValue(raw)
      if (parsed.length === 0) continue

      keysFound.push(key)
      countsByKey[key] = parsed.length

      for (const can of parsed) {
        byId.set(can.id, can)
      }
    } catch {
      // ignore invalid key data
    }
  }

  return {
    cans: [...byId.values()],
    keysFound,
    countsByKey,
  }
}

export function hasDiscoverableGuestCans(): boolean {
  return discoverGuestCans().cans.length > 0
}
