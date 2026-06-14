import type { Can, CanInsert } from '../types/can'

import type { UserCanStatusMap } from '../types/userCanStatus'
import type { MasterCan, MasterCanWithStatus } from '../types/masterCan'

import { getDefaultCollectionSource, resolveCanImage } from './canImage'
import { normalizeImageSource } from '../types/imageSource'

import { getApprovedMasterReferenceImageUrl } from './masterReferenceImage'



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

export function normalizeSku(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase()
}

export function findMasterBySku(masters: MasterCan[], sku: string): MasterCan | null {
  const code = normalizeSku(sku)
  if (!code) return null
  return masters.find((m) => m.sku && normalizeSku(m.sku) === code) ?? null
}

export function findMasterByProductId(masters: MasterCan[], productId: string): MasterCan | null {
  const id = productId.trim()
  if (!id) return null
  return masters.find((m) => m.external_product_id?.trim() === id) ?? null
}



function resolveInsertImage(

  insert: CanInsert,

  master: MasterCan | null,

): Pick<CanInsert, 'image_url' | 'image_source' | 'user_image_url' | 'master_image_url' | 'off_image_url'> {

  const master_image_url = master
    ? getApprovedMasterReferenceImageUrl(master)
    : insert.master_image_url ?? null



  const candidates = {

    user_image_url: insert.user_image_url,

    master_image_url,

    off_image_url: insert.off_image_url,

    master_reference_approved: master_image_url ? true : false,

  }



  if (insert.user_image_url?.trim()) {

    return {

      ...resolveCanImage('user_uploaded', candidates),

      user_image_url: insert.user_image_url,

      master_image_url,

      off_image_url: insert.off_image_url ?? null,

    }

  }



  const normalizedSource = normalizeImageSource(insert.image_source)

  const source =
    normalizedSource === 'user_uploaded'
      ? getDefaultCollectionSource(candidates)
      : normalizedSource === 'open_food_facts_unverified'
        ? 'open_food_facts_unverified'
        : getDefaultCollectionSource(candidates)



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

  let master = findMasterByBarcode(masters, insert.barcode)

  if (!master) return insert



  const imageFields = resolveInsertImage(insert, master)



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

  statusMap?: UserCanStatusMap,

): MasterCanWithStatus[] {

  return masters.map((master) => {

    const owned = isMasterCanOwned(master, userCans)

    const userStatus = statusMap?.[master.id] ?? null

    const wanted =

      userStatus === 'want' ||

      isMasterCanWanted(master, userCans) ||

      (wishlistedMasterIds?.has(master.id) ?? false)

    const needed = userStatus === 'need'

    const markedGot = userStatus === 'got' || owned

    return {

      ...master,

      owned,

      wanted,

      needed,

      markedGot,

      userStatus,

    }

  })

}



export function masterCanToWishlistInsert(master: MasterCan): CanInsert {

  const master_image_url = getApprovedMasterReferenceImageUrl(master)

  const resolved = resolveCanImage(

    master_image_url ? 'master_reference' : 'default_placeholder',

    { master_image_url, master_reference_approved: Boolean(master_image_url) },

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

export function masterCanToCollectionInsert(master: MasterCan): CanInsert {
  const master_image_url = getApprovedMasterReferenceImageUrl(master)
  const resolved = resolveCanImage(
    master_image_url ? 'master_reference' : 'default_placeholder',
    { master_image_url, master_reference_approved: Boolean(master_image_url) },
  )

  return {
    master_can_id: master.id,
    barcode: master.barcode,
    name: master.product_name,
    brand: master.brand,
    flavor: master.flavor,
    volume: master.volume,
    country: master.variant_country ?? master.country,
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
    wanted: false,
    notes: null,
    rarity: master.rarity,
    quantity: 1,
    is_wishlist: false,
    wishlist_status: null,
  }
}


