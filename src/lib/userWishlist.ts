import type { UserWishlistEntry } from '../types/userWishlist'
import {
  addLocalUserWishlist,
  fetchLocalUserWishlist,
  getLocalWishlistedMasterIds,
  removeLocalUserWishlist,
} from './localUserWishlist'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function useLocalWishlistStore(): boolean {
  return !isConfigured || useGuestStorage()
}

export async function fetchUserWishlist(userId: string): Promise<UserWishlistEntry[]> {
  if (useLocalWishlistStore()) return fetchLocalUserWishlist(userId)

  const client = requireClient()
  const { data, error } = await client
    .from('user_wishlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as UserWishlistEntry[]
}

export async function getWishlistedMasterIds(userId: string): Promise<Set<string>> {
  if (useLocalWishlistStore()) return getLocalWishlistedMasterIds(userId)
  const entries = await fetchUserWishlist(userId)
  return new Set(entries.map((e) => e.master_can_id))
}

export async function addUserWishlist(userId: string, masterCanId: string): Promise<UserWishlistEntry> {
  if (useLocalWishlistStore()) return addLocalUserWishlist(userId, masterCanId)

  const client = requireClient()
  const { data, error } = await client
    .from('user_wishlist')
    .upsert({ user_id: userId, master_can_id: masterCanId, status: 'wanted' }, { onConflict: 'user_id,master_can_id' })
    .select()
    .single()

  if (error) throw error
  return data as UserWishlistEntry
}

export async function removeUserWishlist(userId: string, masterCanId: string): Promise<void> {
  if (useLocalWishlistStore()) {
    removeLocalUserWishlist(userId, masterCanId)
    return
  }

  const client = requireClient()
  const { error } = await client
    .from('user_wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('master_can_id', masterCanId)

  if (error) throw error
}
