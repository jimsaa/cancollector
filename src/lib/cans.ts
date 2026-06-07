import type { Can, CanInsert, CanUpdate } from '../types/can'
import { useGuestStorage } from './guestStorage'
import { normalizeCanRecord, normalizeCanTradeFields } from './tradeFields'
import { removeTradeRecordsForCan, syncTradeFromCan } from './tradeSync'
import {
  createLocalCan,
  deleteLocalCan,
  fetchLocalCanById,
  fetchLocalCans,
  replaceLocalCans,
  updateLocalCan,
} from './localCans'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase client unavailable')
  }
  return supabase
}

export async function fetchCans(userId: string): Promise<Can[]> {
  if (useGuestStorage()) return fetchLocalCans(userId)

  const client = requireClient()
  const { data, error } = await client
    .from('cans')
    .select('*')
    .eq('user_id', userId)
    .order('added_date', { ascending: false })

  if (error) throw error
  return ((data ?? []) as Can[]).map(normalizeCanRecord)
}

export async function fetchCanById(id: string): Promise<Can | null> {
  if (useGuestStorage()) return fetchLocalCanById(id)

  const client = requireClient()
  const { data, error } = await client.from('cans').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data ? normalizeCanRecord(data as Can) : null
}

export async function createCan(
  userId: string,
  can: CanInsert,
  options?: { maxActiveListings?: number; skipTradeSync?: boolean },
): Promise<Can> {
  const normalized = normalizeCanTradeFields(can)

  if (useGuestStorage()) {
    const created = normalizeCanRecord(await createLocalCan(userId, normalized))
    await syncTradeFromCan(created, options?.maxActiveListings ?? 999)
    return created
  }

  const client = requireClient()
  const { data, error } = await client
    .from('cans')
    .insert({ ...normalized, user_id: userId })
    .select()
    .single()

  if (error) throw error
  const created = normalizeCanRecord(data as Can)
  if (!options?.skipTradeSync) {
    await syncTradeFromCan(created, options?.maxActiveListings ?? 999)
  }
  return created
}

export async function updateCan(
  id: string,
  updates: CanUpdate,
  options?: { maxActiveListings?: number; skipTradeSync?: boolean },
): Promise<Can> {
  const normalized = normalizeCanTradeFields(updates)

  if (useGuestStorage()) {
    const updated = normalizeCanRecord(await updateLocalCan(id, normalized))
    await syncTradeFromCan(updated, options?.maxActiveListings ?? 999)
    return updated
  }

  const client = requireClient()
  const { data, error } = await client
    .from('cans')
    .update(normalized)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  const updated = normalizeCanRecord(data as Can)
  if (!options?.skipTradeSync) {
    await syncTradeFromCan(updated, options?.maxActiveListings ?? 999)
  }
  return updated
}

export async function deleteCan(id: string): Promise<void> {
  if (useGuestStorage()) {
    await removeTradeRecordsForCan(id)
    return deleteLocalCan(id)
  }

  await removeTradeRecordsForCan(id)

  const client = requireClient()
  const { error } = await client.from('cans').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTradeCans(userId: string): Promise<Can[]> {
  if (useGuestStorage()) {
    const cans = await fetchLocalCans(userId)
    return cans
      .filter((c) => c.available_for_trade)
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }

  const client = requireClient()
  const { data, error } = await client
    .from('cans')
    .select('*')
    .eq('user_id', userId)
    .eq('available_for_trade', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Can[]
}

export interface CollectionStats {
  total: number
  opened: number
  unopened: number
  forTrade: number
}

export function computeStats(cans: Can[]): CollectionStats {
  const collection = cans.filter((c) => !c.is_wishlist)
  return {
    total: collection.reduce((sum, c) => sum + c.quantity, 0),
    opened: collection.filter((c) => c.opened).reduce((sum, c) => sum + c.quantity, 0),
    unopened: collection.filter((c) => !c.opened).reduce((sum, c) => sum + c.quantity, 0),
    forTrade: collection.filter((c) => c.available_for_trade).reduce((sum, c) => sum + c.quantity, 0),
  }
}

export async function importCans(userId: string, cans: Can[], mode: 'merge' | 'replace'): Promise<void> {
  if (useGuestStorage()) {
    if (mode === 'replace') {
      await replaceLocalCans(userId, cans)
      return
    }
    const existing = await fetchLocalCans(userId)
    await replaceLocalCans(userId, [...existing, ...cans])
    return
  }

  const client = requireClient()
  if (mode === 'replace') {
    const { error: delError } = await client.from('cans').delete().eq('user_id', userId)
    if (delError) throw delError
  }

  const rows = cans.map(({ id: _id, user_id: _uid, added_date, ...rest }) => ({
    ...rest,
    user_id: userId,
    added_date: added_date ?? new Date().toISOString(),
  }))

  if (rows.length === 0) return
  const { error } = await client.from('cans').insert(rows)
  if (error) throw error
}
