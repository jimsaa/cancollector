import type { Can } from '../types/can'
import type { PublicProfile, PublicProfileStats } from '../types/profile'
import type { TradeListing } from '../types/trade'
import { computeCollectionProgress } from './collectionProgress'
import { computeStats } from './cans'
import { fetchMasterCans } from './masterCans'
import { normalizeCanRecord } from './tradeFields'
import { normalizeListing } from './tradeListings'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function normalizePublicProfile(raw: Record<string, unknown>): PublicProfile | null {
  const username = raw.username as string | null
  if (!username) return null
  return {
    id: raw.id as string,
    username: username.toLowerCase(),
    public_display_name: (raw.public_display_name as string | null) ?? null,
    bio: (raw.bio as string | null) ?? null,
    country: (raw.country as string | null) ?? null,
    avatar_url: (raw.avatar_url as string | null) ?? null,
    is_public_profile: Boolean(raw.is_public_profile),
    premium_status: (raw.premium_status as PublicProfile['premium_status']) ?? 'free',
    premium_until: (raw.premium_until as string | null) ?? null,
    created_at: raw.created_at as string,
  }
}

const PUBLIC_PROFILE_SELECT =
  'id, username, public_display_name, bio, country, avatar_url, is_public_profile, premium_status, premium_until, created_at'

function isRpcUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const record = err as { code?: string; message?: string }
  if (record.code === 'PGRST202') return true
  const msg = (record.message ?? '').toLowerCase()
  return (
    msg.includes('get_profile_by_username') ||
    (msg.includes('function') && msg.includes('does not exist'))
  )
}

async function fetchPublicProfileDirect(handle: string): Promise<PublicProfile | null> {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .select(PUBLIC_PROFILE_SELECT)
    .ilike('username', handle)
    .limit(1)

  if (error) throw error
  const row = data?.[0]
  return row ? normalizePublicProfile(row as Record<string, unknown>) : null
}

export async function fetchProfileByUsername(username: string): Promise<PublicProfile | null> {
  if (!isConfigured) return null

  const client = requireClient()
  const handle = username.trim().toLowerCase()
  if (!handle) return null

  let profile: PublicProfile | null = null

  const { data, error } = await client.rpc('get_profile_by_username', {
    p_username: handle,
  })

  if (!error) {
    const row = Array.isArray(data) ? data[0] : data
    if (row) profile = normalizePublicProfile(row as Record<string, unknown>)
  }

  if (!profile) {
    profile = await fetchPublicProfileDirect(handle)
  }

  if (!profile && error && !isRpcUnavailableError(error)) {
    throw error
  }

  return profile
}

export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  if (!isConfigured) return false

  const client = requireClient()
  const handle = username.trim().toLowerCase()

  let query = client.from('profiles').select('id').ilike('username', handle)
  if (excludeUserId) query = query.neq('id', excludeUserId)

  const { data, error } = await query.limit(1)
  if (error) throw new Error(error.message || 'Could not check username availability')
  return !data?.length
}

export async function fetchPublicCans(userId: string): Promise<Can[]> {
  if (!isConfigured) return []

  try {
    const client = requireClient()
    const { data, error } = await client
      .from('cans')
      .select('*')
      .eq('user_id', userId)
      .order('added_date', { ascending: false })

    if (error) return []
    return ((data ?? []) as Can[]).map(normalizeCanRecord)
  } catch {
    return []
  }
}

export async function fetchPublicTradeListings(userId: string): Promise<TradeListing[]> {
  if (!isConfigured) return []

  try {
    const client = requireClient()
    const { data, error } = await client
      .from('trade_listings')
      .select('*')
      .eq('user_id', userId)
      .eq('trade_status', 'available')
      .order('created_at', { ascending: false })

    if (error) return []
    return (data ?? []).map((row) => normalizeListing(row as Record<string, unknown>))
  } catch {
    return []
  }
}

export async function computePublicProfileStats(_userId: string, cans: Can[]): Promise<PublicProfileStats> {
  const collection = cans.filter((c) => !c.is_wishlist)
  const stats = computeStats(cans)
  const wishlistCount = cans.filter((c) => c.is_wishlist).length
  const tradeCount = collection.filter((c) => c.available_for_trade).length

  let completionPercentage = 0
  let completionOwned = 0
  let completionTotal = 0

  try {
    const masters = await fetchMasterCans('all')
    const progress = computeCollectionProgress(masters, cans, 'all')
    completionPercentage = progress.percentage
    completionOwned = progress.owned
    completionTotal = progress.total
  } catch {
    // master DB unavailable — show 0%
  }

  return {
    totalCans: stats.total,
    unopenedCount: stats.unopened,
    tradeCount,
    wishlistCount,
    completionPercentage,
    completionOwned,
    completionTotal,
  }
}

export function getPublicDisplayName(profile: PublicProfile): string {
  return profile.public_display_name || profile.username
}
