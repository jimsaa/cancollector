import type { Can } from '../types/can'

import type { TradeListing, TradeProfile, TradeWant } from '../types/trade'
import { filterActiveTradeListings } from '../types/trade'

import {

  ensureTradeListingForCan,

  fetchUserTradeListings,

  listingDefaultsFromCan,

  removeTradeListingForCan,

} from './tradeListings'

import { useGuestStorage } from './guestStorage'

import { supabase } from './supabase'

import {

  deleteLocalTradeListingByCanId,

  getLocalTradeListings,

} from './localTradeListings'



function requireClient() {

  if (!supabase) throw new Error('Supabase client unavailable')

  return supabase

}



function wantFromCan(can: Can) {

  return {

    user_id: can.user_id,

    can_id: can.id,

    master_can_id: can.master_can_id,

    barcode: can.barcode,

    brand: can.brand,

    product_name: can.name,

    flavor: can.flavor,

    volume: can.volume,

    region: can.country,

    active: true,

  }

}



export async function ensureTradeProfile(userId: string): Promise<void> {

  if (useGuestStorage()) return



  const client = requireClient()

  const { error } = await client

    .from('trade_profiles')

    .upsert({ user_id: userId }, { onConflict: 'user_id' })



  if (error) throw error

}



export async function syncTradeListingFromCan(

  can: Can,

  maxActiveListings = 999,

): Promise<void> {

  const shouldList = !can.is_wishlist && can.available_for_trade



  if (!shouldList) {

    await removeTradeListingForCan(can.id)

    return

  }



  await ensureTradeProfile(can.user_id)

  await ensureTradeListingForCan(can, maxActiveListings)

}



export async function syncTradeWantFromCan(can: Can): Promise<void> {

  if (useGuestStorage()) return



  const client = requireClient()

  await ensureTradeProfile(can.user_id)



  if (!can.wanted) {

    if (can.id) {

      const { error } = await client.from('trade_wants').delete().eq('can_id', can.id)

      if (error) throw error

    }

    return

  }



  const { error } = await client.from('trade_wants').upsert(wantFromCan(can), {

    onConflict: 'can_id',

  })



  if (error) throw error

}



export async function syncTradeFromCan(can: Can, maxActiveListings = 999): Promise<void> {

  await Promise.all([

    syncTradeListingFromCan(can, maxActiveListings),

    syncTradeWantFromCan(can),

  ])

}



export async function removeTradeRecordsForCan(canId: string): Promise<void> {

  if (useGuestStorage()) {

    deleteLocalTradeListingByCanId(canId)

    return

  }



  const client = requireClient()

  await Promise.all([

    client.from('trade_listings').delete().eq('can_id', canId),

    client.from('trade_wants').delete().eq('can_id', canId),

  ])

}



export async function fetchTradeProfile(userId: string): Promise<TradeProfile | null> {

  if (useGuestStorage()) {

    return {

      user_id: userId,

      matching_enabled: false,

      public_trade_list: true,

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString(),

    }

  }



  const client = requireClient()

  const { data, error } = await client

    .from('trade_profiles')

    .select('*')

    .eq('user_id', userId)

    .maybeSingle()



  if (error) throw error

  return data as TradeProfile | null

}



export async function updateTradeProfile(

  userId: string,

  updates: Partial<Pick<TradeProfile, 'matching_enabled' | 'public_trade_list'>>,

): Promise<TradeProfile> {

  if (useGuestStorage()) {

    return {

      user_id: userId,

      matching_enabled: updates.matching_enabled ?? false,

      public_trade_list: updates.public_trade_list ?? true,

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString(),

    }

  }



  const client = requireClient()

  await ensureTradeProfile(userId)



  const { data, error } = await client

    .from('trade_profiles')

    .update(updates)

    .eq('user_id', userId)

    .select()

    .single()



  if (error) throw error

  return data as TradeProfile

}



/** Derive trade listings from local storage + cans fallback. */

export function deriveLocalListings(cans: Can[], userId: string): TradeListing[] {

  const stored = getLocalTradeListings(userId)

  const storedByCan = new Map(stored.map((l) => [l.can_id, l]))

  const now = new Date().toISOString()



  return cans

    .filter((c) => c.user_id === userId && !c.is_wishlist && c.available_for_trade)

    .map((c) => {

      const existing = storedByCan.get(c.id)

      if (existing) return existing

      return {

        ...listingDefaultsFromCan(c),

        id: `local-listing-${c.id}`,

        created_at: c.added_date,

        updated_at: now,

      }

    })

    .filter((l) => filterActiveTradeListings([l]).length > 0)

}



/** Derive trade wants from local cans collection. */

export function deriveLocalWants(cans: Can[], userId: string): TradeWant[] {

  const now = new Date().toISOString()

  return cans

    .filter((c) => c.user_id === userId && c.wanted)

    .map((c) => ({

      id: `local-want-${c.id}`,

      user_id: c.user_id,

      can_id: c.id,

      master_can_id: c.master_can_id,

      barcode: c.barcode,

      brand: c.brand,

      product_name: c.name,

      flavor: c.flavor,

      volume: c.volume,

      region: c.country,

      priority: 0,

      active: true,

      created_at: c.added_date,

      updated_at: now,

    }))

}



export async function fetchUserListings(userId: string, cans: Can[]): Promise<TradeListing[]> {

  if (useGuestStorage()) return deriveLocalListings(cans, userId)



  const listings = await fetchUserTradeListings(userId)

  return filterActiveTradeListings(listings)

}



export async function fetchUserWants(userId: string, cans: Can[]): Promise<TradeWant[]> {

  if (useGuestStorage()) return deriveLocalWants(cans, userId)



  const client = requireClient()

  const { data, error } = await client

    .from('trade_wants')

    .select('*')

    .eq('user_id', userId)

    .eq('active', true)

    .order('priority', { ascending: false })



  if (error) throw error

  return (data ?? []) as TradeWant[]

}


