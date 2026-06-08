import type { Can, CanInsert } from '../types/can'
import type { MasterCan, MasterCanWithStatus } from '../types/masterCan'
import { getDefaultProductSource, resolveCanImage } from './canImage'
import { getMasterReferenceImageUrl } from './masterReferenceImage'

export function normalizeBarcode(barcode: string | null | undefined): string {
  return (barcode ?? '').trim()
}

export function isMasterCanOwned(master: MasterCan, userCans: Can[]): boolean {
  const owned = userCans.filter((c) => !c.is_wishlist)

  if (owned.some((c) => c.master_can_id === master.id)) return true

  const code = normalizeBarcode(master.barcode)
  if (!code) return false

  return owned.some((c) => normalizeBarcode(c.barcode) === code)
}

export function isMasterCanWanted(master: MasterCan, userCans: Can[]): boolean {
  const wishlist = userCans.filter((c) => c.is_wishlist)

  if (wishlist.some((c) => c.master_can_id === master.id)) return true

  const code = normalizeBarcode(master.barcode)
  if (!code) return false

  return wishlist.some((c) => normalizeBarcode(c.barcode) === code)
}

export function findWishlistEntryForMaster(master: MasterCan, userCans: Can[]): Can | null {
  const wishlist = userCans.filter((c) => c.is_wishlist)
  const byId = wishlist.find((c) => c.master_can_id === master.id)
  if (byId) return byId

  const code = normalizeBarcode(master.barcode)
  if (!code) return null

  return wishlist.find((c) => normalizeBarcode(c.barcode) === code) ?? null
}

export function findMasterByBarcode(masters: MasterCan[], barcode: string): MasterCan | null {
  const code = normalizeBarcode(barcode)
  if (!code) return null
  return masters.find((m) => normalizeBarcode(m.barcode) === code) ?? null
}

function resolveInsertImage(
  insert: CanInsert,
  masterImageUrl: string | null,
): Pick<CanInsert, 'image_url' | 'image_source' | 'user_image_url' | 'master_image_url' | 'off_image_url'> {
  const master_image_url = masterImageUrl ?? insert.master_image_url ?? null
  const candidates = {
    user_image_url: insert.user_image_url,
    master_image_url,
    off_image_url: insert.off_image_url,
  }

  if (insert.user_image_url?.trim()) {
    return {
      ...resolveCanImage('user', candidates),
      user_image_url: insert.user_image_url,
      master_image_url,
      off_image_url: insert.off_image_url ?? null,
    }
  }

  const source =
    insert.image_source === 'user'
      ? getDefaultProductSource(candidates)
      : master_image_url
        ? 'master_database'
        : insert.image_source

  const resolved = resolveCanImage(source, candidates)
  return {
    ...resolved,
    user_image_url: insert.user_image_url ?? null,
    master_image_url,
    off_image_url: insert.off_image_url ?? null,
  }
}

export function attachMasterCanLink(
  insert: CanInsert,
  masters: MasterCan[],
): CanInsert {
  if (insert.master_can_id || !insert.barcode) return insert
  const master = findMasterByBarcode(masters, insert.barcode)
  if (!master) return insert

  const imageFields = resolveInsertImage(insert, getMasterReferenceImageUrl(master))

  return {
    ...insert,
    master_can_id: master.id,
    brand: insert.brand ?? master.brand,
    name: insert.name ?? master.product_name,
    flavor: insert.flavor ?? master.flavor,
    volume: insert.volume ?? master.volume,
    country: insert.country ?? master.country,
    country_variant: insert.country_variant ?? master.variant_name,
    rarity: insert.rarity === 'unknown' ? master.rarity : insert.rarity,
    ...imageFields,
  }
}

export function attachMasterStatus(
  masters: MasterCan[],
  userCans: Can[],
  wishlistedMasterIds?: Set<string>,
): MasterCanWithStatus[] {
  return masters.map((master) => ({
    ...master,
    owned: isMasterCanOwned(master, userCans),
    wanted:
      isMasterCanWanted(master, userCans) || (wishlistedMasterIds?.has(master.id) ?? false),
  }))
}

export function masterCanToWishlistInsert(master: MasterCan): CanInsert {
  const master_image_url = getMasterReferenceImageUrl(master)
  const resolved = resolveCanImage(
    master_image_url ? 'master_database' : 'placeholder',
    { master_image_url },
  )

  return {
    master_can_id: master.id,
    barcode: master.barcode,
    name: master.product_name,
    brand: master.brand,
    flavor: master.flavor,
    volume: master.volume,
    country: master.country,
    country_variant: master.variant_name,
    image_url: resolved.image_url,
    image_source: resolved.image_source,
    user_image_url: null,
    master_image_url,
    off_image_url: null,
    opening_status: 'sealed',
    opened: false,
    purchase_date: null,
    purchase_country: null,
    purchase_city: null,
    purchase_store: null,
    trade_status: 'not_for_trade',
    available_for_trade: false,
    trade_price: null,
    trade_currency: null,
    trade_note: null,
    is_public: false,
    show_on_public_profile: false,
    condition_grade: 'unknown',
    condition_notes: null,
    wanted: true,
    notes: null,
    rarity: master.rarity,
    quantity: 1,
    is_wishlist: true,
    wishlist_status: 'wanted',
  }
}
