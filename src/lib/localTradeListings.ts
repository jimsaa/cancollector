import type { TradeListing } from '../types/trade'
import { generateId } from './id'

const STORAGE_KEY = 'cancollector-trade-listings'

function readAll(): TradeListing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TradeListing[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(listings: TradeListing[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
}

export function getLocalTradeListings(userId?: string): TradeListing[] {
  const all = readAll()
  return userId ? all.filter((l) => l.user_id === userId) : all
}

export function getLocalTradeListingById(id: string): TradeListing | null {
  return readAll().find((l) => l.id === id) ?? null
}

export function getLocalTradeListingByCanId(canId: string): TradeListing | null {
  return readAll().find((l) => l.can_id === canId) ?? null
}

export function upsertLocalTradeListing(listing: TradeListing): TradeListing {
  const all = readAll()
  const index = all.findIndex((l) => l.can_id === listing.can_id)
  const now = new Date().toISOString()
  const saved: TradeListing = {
    ...listing,
    updated_at: now,
    created_at: listing.created_at || now,
    id: listing.id || generateId(),
  }
  if (index >= 0) {
    all[index] = { ...all[index], ...saved, id: all[index].id, created_at: all[index].created_at }
  } else {
    all.push(saved)
  }
  writeAll(all)
  return index >= 0 ? all[index] : saved
}

export function deleteLocalTradeListingByCanId(canId: string): void {
  writeAll(readAll().filter((l) => l.can_id !== canId))
}

export function deleteLocalTradeListingById(id: string): void {
  writeAll(readAll().filter((l) => l.id !== id))
}
