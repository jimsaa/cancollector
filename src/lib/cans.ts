import type { Can, CanInsert, CanUpdate } from '../types/can'
import {
  formatSaveCanError,
  logSaveCanError,
  shouldRetryWithoutExtendedColumns,
  stripExtendedCanColumns,
  toSupabaseCanRow,
  toSupabaseCanUpdate,
} from './canSupabase'
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
  const row = toSupabaseCanRow(userId, normalized)

  let result = await client.from('cans').insert(row).select().single()

  if (result.error && shouldRetryWithoutExtendedColumns(result.error)) {
    if (import.meta.env.DEV) {
      console.warn('[SAVE_CAN_ERROR] Retrying insert without extended columns', result.error)
    }
    result = await client.from('cans').insert(stripExtendedCanColumns(row)).select().single()
  }

  if (result.error) {
    logSaveCanError(result.error, { operation: 'insert', userId, row })
    throw new Error(formatSaveCanError(result.error))
  }

  const created = normalizeCanRecord(result.data as Can)

  if (!options?.skipTradeSync) {
    try {
      await syncTradeFromCan(created, options?.maxActiveListings ?? 999)
    } catch (tradeErr) {
      logSaveCanError(tradeErr, { operation: 'trade_sync_after_insert', canId: created.id })
    }
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
  const row = toSupabaseCanUpdate(normalized)

  let result = await client.from('cans').update(row).eq('id', id).select().single()

  if (result.error && shouldRetryWithoutExtendedColumns(result.error)) {
    if (import.meta.env.DEV) {
      console.warn('[SAVE_CAN_ERROR] Retrying update without extended columns', result.error)
    }
    result = await client
      .from('cans')
      .update(stripExtendedCanColumns(row))
      .eq('id', id)
      .select()
      .single()
  }

  if (result.error) {
    logSaveCanError(result.error, { operation: 'update', canId: id, row })
    throw new Error(formatSaveCanError(result.error))
  }

  const updated = normalizeCanRecord(result.data as Can)

  if (!options?.skipTradeSync) {
    try {
      await syncTradeFromCan(updated, options?.maxActiveListings ?? 999)
    } catch (tradeErr) {
      logSaveCanError(tradeErr, { operation: 'trade_sync_after_update', canId: id })
    }
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
