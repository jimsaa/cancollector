import type { UserWishlistEntry } from '../types/userWishlist'
import { generateId } from './id'

const KEY = 'cancollector-user-wishlist'

function readAll(): UserWishlistEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as UserWishlistEntry[]
  } catch {
    return []
  }
}

function writeAll(entries: UserWishlistEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function fetchLocalUserWishlist(userId: string): UserWishlistEntry[] {
  return readAll().filter((e) => e.user_id === userId)
}

export function getLocalWishlistedMasterIds(userId: string): Set<string> {
  return new Set(fetchLocalUserWishlist(userId).map((e) => e.master_can_id))
}

export function addLocalUserWishlist(userId: string, masterCanId: string): UserWishlistEntry {
  const existing = readAll().find((e) => e.user_id === userId && e.master_can_id === masterCanId)
  if (existing) return existing

  const entry: UserWishlistEntry = {
    id: generateId(),
    user_id: userId,
    master_can_id: masterCanId,
    status: 'wanted',
    created_at: new Date().toISOString(),
  }
  writeAll([entry, ...readAll()])
  return entry
}

export function removeLocalUserWishlist(userId: string, masterCanId: string): void {
  writeAll(readAll().filter((e) => !(e.user_id === userId && e.master_can_id === masterCanId)))
}
