import type { Can, CanInsert, CanUpdate } from '../types/can'
import { isLocalMode } from './mode'
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
  if (isLocalMode) return fetchLocalCans(userId)

  const client = requireClient()
  const { data, error } = await client
    .from('cans')
    .select('*')
    .eq('user_id', userId)
    .order('added_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as Can[]
}

export async function fetchCanById(id: string): Promise<Can | null> {
  if (isLocalMode) return fetchLocalCanById(id)

  const client = requireClient()
  const { data, error } = await client.from('cans').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data as Can | null
}

export async function createCan(userId: string, can: CanInsert): Promise<Can> {
  if (isLocalMode) return createLocalCan(userId, can)

  const client = requireClient()
  const { data, error } = await client
    .from('cans')
    .insert({ ...can, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Can
}

export async function updateCan(id: string, updates: CanUpdate): Promise<Can> {
  if (isLocalMode) return updateLocalCan(id, updates)

  const client = requireClient()
  const { data, error } = await client.from('cans').update(updates).eq('id', id).select().single()

  if (error) throw error
  return data as Can
}

export async function deleteCan(id: string): Promise<void> {
  if (isLocalMode) return deleteLocalCan(id)

  const client = requireClient()
  const { error } = await client.from('cans').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTradeCans(userId: string): Promise<Can[]> {
  if (isLocalMode) {
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
  if (isLocalMode) {
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
