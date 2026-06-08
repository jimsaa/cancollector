import type { Can, CanInsert, CanUpdate } from '../types/can'
import { normalizeCanCollectorFields } from './canCollectorFields'
import { normalizeCanImageFields } from './canImage'
import { discoverGuestCans, GUEST_CAN_STORAGE_KEYS } from './localCanDiscovery'
import { generateId } from './id'

const CANS_KEY = 'cancollector-cans'
const USER_ID_KEY = 'cancollector-local-user-id'

let sessionUserId: string | null = null

export function getLocalUserId(): string {
  try {
    let id = localStorage.getItem(USER_ID_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(USER_ID_KEY, id)
    }
    return id
  } catch {
    if (!sessionUserId) sessionUserId = generateId()
    return sessionUserId
  }
}

function readAll(): Can[] {
  try {
    const raw = localStorage.getItem(CANS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Can[]
    return parsed.map(migrateCan)
  } catch {
    return []
  }
}

function migrateCan(c: Can): Can {
  return normalizeCanCollectorFields(
    normalizeCanImageFields({
      ...c,
      master_can_id: c.master_can_id ?? null,
      country_variant: c.country_variant ?? null,
      available_for_trade: c.available_for_trade ?? false,
      wanted: c.wanted ?? (c.is_wishlist ? c.wishlist_status !== 'missing' : false),
      is_wishlist: c.is_wishlist ?? false,
      wishlist_status: c.wishlist_status ?? null,
      image_source: c.image_source ?? 'default_placeholder',
      user_image_url: c.user_image_url ?? null,
      master_image_url: c.master_image_url ?? null,
      off_image_url: c.off_image_url ?? null,
    }),
  )
}

function writeAll(cans: Can[]): void {
  try {
    localStorage.setItem(CANS_KEY, JSON.stringify(cans))
  } catch {
    throw new Error('Could not save — browser storage may be full or disabled')
  }
}

function toCan(userId: string, input: CanInsert): Can {
  return {
    id: generateId(),
    user_id: userId,
    master_can_id: input.master_can_id ?? null,
    barcode: input.barcode ?? null,
    name: input.name ?? null,
    brand: input.brand ?? null,
    flavor: input.flavor ?? null,
    volume: input.volume ?? null,
    country: input.country ?? null,
    country_variant: input.country_variant ?? null,
    image_url: input.image_url ?? null,
    image_source: input.image_source ?? 'default_placeholder',
    user_image_url: input.user_image_url ?? null,
    master_image_url: input.master_image_url ?? null,
    off_image_url: input.off_image_url ?? null,
    opening_status: input.opening_status ?? 'sealed',
    opened: input.opened ?? false,
    purchase_date: input.purchase_date ?? null,
    purchase_country: input.purchase_country ?? null,
    purchase_city: input.purchase_city ?? null,
    purchase_store: input.purchase_store ?? null,
    added_date: new Date().toISOString(),
    trade_status: input.trade_status ?? 'not_for_trade',
    available_for_trade: input.available_for_trade ?? false,
    trade_price: input.trade_price ?? null,
    trade_currency: input.trade_currency ?? null,
    trade_note: input.trade_note ?? null,
    is_public: input.is_public ?? false,
    show_on_public_profile: input.show_on_public_profile ?? false,
    condition_grade: input.condition_grade ?? 'unknown',
    condition_notes: input.condition_notes ?? null,
    wanted: input.wanted ?? false,
    notes: input.notes ?? null,
    rarity: input.rarity ?? 'unknown',
    quantity: input.quantity ?? 1,
    is_wishlist: input.is_wishlist ?? false,
    wishlist_status: input.wishlist_status ?? null,
  }
}

export async function fetchLocalCans(userId: string): Promise<Can[]> {
  return readAll()
    .filter((c) => c.user_id === userId)
    .sort((a, b) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime())
}

export async function fetchLocalCanById(id: string): Promise<Can | null> {
  const can = readAll().find((c) => c.id === id)
  return can ? migrateCan(can) : null
}

export async function createLocalCan(userId: string, can: CanInsert): Promise<Can> {
  const created = migrateCan(toCan(userId, can))
  writeAll([created, ...readAll()])
  return created
}

export async function updateLocalCan(id: string, updates: CanUpdate): Promise<Can> {
  const cans = readAll()
  const index = cans.findIndex((c) => c.id === id)
  if (index === -1) throw new Error('Can not found')

  const updated = migrateCan({ ...cans[index], ...updates })
  cans[index] = updated
  writeAll(cans)
  return updated
}

export async function deleteLocalCan(id: string): Promise<void> {
  writeAll(readAll().filter((c) => c.id !== id))
}

export async function replaceLocalCans(userId: string, cans: Can[]): Promise<void> {
  const others = readAll().filter((c) => c.user_id !== userId)
  writeAll([...others, ...cans.map((c) => migrateCan({ ...c, user_id: userId }))])
}

/** All guest cans from primary + legacy localStorage keys. */
export function getAllLocalCans(): Can[] {
  return discoverGuestCans().cans
}

export function hasLocalCans(): boolean {
  return getAllLocalCans().length > 0
}

export function clearLocalCollection(): void {
  for (const key of GUEST_CAN_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}
