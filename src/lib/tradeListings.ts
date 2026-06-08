import type { Can } from '../types/can'
import type { TradeCondition, TradeListing, TradeListingStatus, TradeListingUpdate } from '../types/trade'
import { isListingActive } from '../types/trade'
import { generateId } from './id'
import {
  deleteLocalTradeListingByCanId,
  getLocalTradeListingByCanId,
  getLocalTradeListingById,
  getLocalTradeListings,
  upsertLocalTradeListing,
} from './localTradeListings'
import { useGuestStorage } from './guestStorage'
import { sanitizeAskingFor, sanitizeDescription, sanitizeLocation, sanitizeTitle } from './textSanitize'
import { supabase } from './supabase'
import { isValidYouTubeUrl } from './youtube'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function defaultCondition(can: Can): TradeCondition {
  const grade = can.condition_grade
  if (grade === 'mint' || grade === 'excellent' || grade === 'good' || grade === 'damaged') {
    return grade
  }
  if (grade === 'fair') return 'good'
  if (can.opening_status !== 'sealed') return 'opened'
  return 'unknown'
}

function tradeStatusToActive(status: TradeListingStatus): boolean {
  return status === 'available' || status === 'reserved'
}

export function listingDefaultsFromCan(can: Can): Omit<TradeListing, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: can.user_id,
    can_id: can.id,
    title: can.name ?? 'Trade listing',
    description: '',
    condition: defaultCondition(can),
    trade_status: 'available',
    asking_for: '',
    location_country: can.country,
    location_city: null,
    shipping_available: false,
    local_pickup_available: false,
    extra_image_urls: [],
    youtube_url: null,
    master_can_id: can.master_can_id,
    barcode: can.barcode,
    brand: can.brand,
    product_name: can.name,
    flavor: can.flavor,
    volume: can.volume,
    region: can.country,
    quantity: can.quantity,
    opened: can.opened,
    active: true,
  }
}

function denormalizedFromCan(can: Can) {
  return {
    master_can_id: can.master_can_id,
    barcode: can.barcode,
    brand: can.brand,
    product_name: can.name,
    flavor: can.flavor,
    volume: can.volume,
    region: can.country,
    quantity: can.quantity,
    opened: can.opened,
  }
}

export function normalizeListing(raw: Record<string, unknown>): TradeListing {
  const extra = raw.extra_image_urls
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    can_id: String(raw.can_id),
    title: String(raw.title ?? raw.product_name ?? 'Trade listing'),
    description: String(raw.description ?? ''),
    condition: (raw.condition as TradeCondition) ?? 'unknown',
    trade_status: (raw.trade_status as TradeListingStatus) ?? 'available',
    asking_for: String(raw.asking_for ?? ''),
    location_country: (raw.location_country as string | null) ?? null,
    location_city: (raw.location_city as string | null) ?? null,
    shipping_available: Boolean(raw.shipping_available),
    local_pickup_available: Boolean(raw.local_pickup_available),
    extra_image_urls: Array.isArray(extra) ? (extra as string[]) : [],
    youtube_url: (raw.youtube_url as string | null) ?? null,
    master_can_id: (raw.master_can_id as string | null) ?? null,
    barcode: (raw.barcode as string | null) ?? null,
    brand: (raw.brand as string | null) ?? null,
    product_name: (raw.product_name as string | null) ?? null,
    flavor: (raw.flavor as string | null) ?? null,
    volume: (raw.volume as string | null) ?? null,
    region: (raw.region as string | null) ?? null,
    quantity: Number(raw.quantity ?? 1),
    opened: Boolean(raw.opened),
    active: Boolean(raw.active ?? true),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  }
}

export function sanitizeListingUpdate(updates: TradeListingUpdate): TradeListingUpdate {
  const sanitized: TradeListingUpdate = { ...updates }
  if (updates.title !== undefined) sanitized.title = sanitizeTitle(updates.title)
  if (updates.description !== undefined) sanitized.description = sanitizeDescription(updates.description)
  if (updates.asking_for !== undefined) sanitized.asking_for = sanitizeAskingFor(updates.asking_for)
  if (updates.location_country !== undefined) {
    sanitized.location_country = updates.location_country
      ? sanitizeLocation(updates.location_country)
      : null
  }
  if (updates.location_city !== undefined) {
    sanitized.location_city = updates.location_city ? sanitizeLocation(updates.location_city) : null
  }
  if (updates.youtube_url !== undefined) {
    const url = updates.youtube_url?.trim() || null
    if (url && !isValidYouTubeUrl(url)) {
      throw new Error('Please enter a valid YouTube URL (youtube.com or youtu.be)')
    }
    sanitized.youtube_url = url
  }
  return sanitized
}

export function countActiveListings(listings: TradeListing[], excludeCanId?: string): number {
  return listings.filter(
    (l) => isListingActive(l) && (!excludeCanId || l.can_id !== excludeCanId),
  ).length
}

export function canAddActiveListing(
  listings: TradeListing[],
  maxActive: number,
  excludeCanId?: string,
): boolean {
  return countActiveListings(listings, excludeCanId) < maxActive
}

export async function fetchTradeListingById(id: string): Promise<TradeListing | null> {
  if (useGuestStorage()) return getLocalTradeListingById(id)

  const client = requireClient()
  const { data, error } = await client.from('trade_listings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? normalizeListing(data as Record<string, unknown>) : null
}

export async function fetchTradeListingByCanId(canId: string): Promise<TradeListing | null> {
  if (useGuestStorage()) return getLocalTradeListingByCanId(canId)

  const client = requireClient()
  const { data, error } = await client.from('trade_listings').select('*').eq('can_id', canId).maybeSingle()
  if (error) throw error
  return data ? normalizeListing(data as Record<string, unknown>) : null
}

export async function fetchUserTradeListings(userId: string): Promise<TradeListing[]> {
  if (useGuestStorage()) return getLocalTradeListings(userId)

  const client = requireClient()
  const { data, error } = await client
    .from('trade_listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => normalizeListing(row as Record<string, unknown>))
}

export async function ensureTradeListingForCan(
  can: Can,
  maxActiveListings: number,
): Promise<TradeListing | null> {
  const shouldList = !can.is_wishlist && can.available_for_trade
  if (!shouldList) {
    await removeTradeListingForCan(can.id)
    return null
  }

  const existing = await fetchTradeListingByCanId(can.id)
  const allListings = await fetchUserTradeListings(can.user_id)

  if (!existing && !canAddActiveListing(allListings, maxActiveListings)) {
    throw new Error(
      `Free plan allows ${maxActiveListings} active trade listing. Upgrade to Premium for unlimited listings.`,
    )
  }

  const defaults = listingDefaultsFromCan(can)
  const now = new Date().toISOString()
  const payload: TradeListing = existing
    ? { ...existing, ...denormalizedFromCan(can), active: tradeStatusToActive(existing.trade_status) }
    : { ...defaults, id: generateId(), created_at: now, updated_at: now }

  return upsertTradeListing(payload)
}

export async function upsertTradeListing(listing: TradeListing): Promise<TradeListing> {
  if (useGuestStorage()) return upsertLocalTradeListing(listing)

  const client = requireClient()
  const { data, error } = await client
    .from('trade_listings')
    .upsert(
      {
        ...listing,
        extra_image_urls: listing.extra_image_urls,
        active: tradeStatusToActive(listing.trade_status),
      },
      { onConflict: 'can_id' },
    )
    .select()
    .single()

  if (error) throw error
  return normalizeListing(data as Record<string, unknown>)
}

export async function updateTradeListing(
  listingId: string,
  updates: TradeListingUpdate,
): Promise<TradeListing> {
  const sanitized = sanitizeListingUpdate(updates)

  if (useGuestStorage()) {
    const existing = getLocalTradeListingById(listingId)
    if (!existing) throw new Error('Trade listing not found')
    return upsertLocalTradeListing({ ...existing, ...sanitized })
  }

  const client = requireClient()
  const { data, error } = await client
    .from('trade_listings')
    .update({
      ...sanitized,
      ...(sanitized.trade_status ? { active: tradeStatusToActive(sanitized.trade_status) } : {}),
    })
    .eq('id', listingId)
    .select()
    .single()

  if (error) throw error
  return normalizeListing(data as Record<string, unknown>)
}

export async function removeTradeListingForCan(canId: string): Promise<void> {
  if (useGuestStorage()) {
    deleteLocalTradeListingByCanId(canId)
    return
  }

  const client = requireClient()
  const { error } = await client.from('trade_listings').delete().eq('can_id', canId)
  if (error) throw error
}

export async function syncTradeListingDenormFromCan(can: Can): Promise<void> {
  const existing = await fetchTradeListingByCanId(can.id)
  if (!existing) return

  await upsertTradeListing({
    ...existing,
    ...denormalizedFromCan(can),
    title: existing.title || can.name || 'Trade listing',
    location_country: existing.location_country ?? can.country,
  })
}
