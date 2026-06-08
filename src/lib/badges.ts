import { BADGE_BY_ID, BADGE_CATALOG } from '../data/badgeCatalog'
import type { Badge, BadgeWithEarned } from '../types/badge'
import type { ManualGrantBadgeId } from '../types/badge'
import type { Can } from '../types/can'
import type { Profile } from '../types/profile'
import type { PendingCanSuggestion } from '../types/pendingSuggestion'
import type { TradeListing } from '../types/trade'
import { computeEarnedBadgeIds, type BadgeComputeInput } from './badgeCompute'
import { isConfigured } from './mode'
import type { MasterCan } from '../types/masterCan'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

export async function fetchBadgeCatalog(): Promise<Badge[]> {
  if (!isConfigured) return BADGE_CATALOG

  const client = requireClient()
  const { data, error } = await client.from('badges').select('*').order('sort_order', { ascending: true })

  if (error) return BADGE_CATALOG
  return (data?.length ? data : BADGE_CATALOG) as Badge[]
}

export async function fetchUserBadges(userId: string): Promise<BadgeWithEarned[]> {
  const catalog = await fetchBadgeCatalog()
  const byId = new Map(catalog.map((b) => [b.id, b]))

  if (!isConfigured) return []

  const client = requireClient()
  const { data, error } = await client
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) return []

  return (data ?? [])
    .map((row) => {
      const badge = byId.get(row.badge_id as string)
      if (!badge) return null
      return {
        ...badge,
        earned_at: row.earned_at as string,
        source: row.source as BadgeWithEarned['source'],
      }
    })
    .filter((row): row is BadgeWithEarned => row !== null)
}

async function fetchBadgeStats(userId: string): Promise<{
  feedbackCount: number
  approvedSuggestions: PendingCanSuggestion[]
}> {
  const client = requireClient()

  const [feedbackRes, suggestionsRes] = await Promise.all([
    client.from('feedback').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client
      .from('pending_can_suggestions')
      .select('*')
      .eq('submitted_by', userId)
      .eq('status', 'approved'),
  ])

  return {
    feedbackCount: feedbackRes.count ?? 0,
    approvedSuggestions: (suggestionsRes.data ?? []) as PendingCanSuggestion[],
  }
}

export async function buildBadgeComputeInput(
  userId: string,
  profile: Pick<Profile, 'premium_source' | 'is_premium'> | null,
  cans: Can[],
  masters: MasterCan[],
  tradeListings: TradeListing[],
): Promise<BadgeComputeInput> {
  const stats = isConfigured ? await fetchBadgeStats(userId) : { feedbackCount: 0, approvedSuggestions: [] }
  return {
    profile,
    cans,
    masters,
    tradeListings,
    feedbackCount: stats.feedbackCount,
    approvedSuggestions: stats.approvedSuggestions,
  }
}

export async function syncComputedBadges(userId: string, earnedIds: string[]): Promise<void> {
  if (!isConfigured || earnedIds.length === 0) return

  const client = requireClient()

  const { data: existing } = await client
    .from('user_badges')
    .select('badge_id, source')
    .eq('user_id', userId)

  const manualIds = new Set(
    (existing ?? []).filter((r) => r.source === 'manual' || r.source === 'premium').map((r) => r.badge_id as string),
  )

  const toInsert = earnedIds.filter((id) => !manualIds.has(id))
  if (toInsert.length === 0) return

  const rows = toInsert.map((badge_id) => ({
    user_id: userId,
    badge_id,
    source: 'computed' as const,
  }))

  const { error } = await client.from('user_badges').upsert(rows, {
    onConflict: 'user_id,badge_id',
    ignoreDuplicates: false,
  })

  if (error && import.meta.env.DEV) {
    console.warn('[badges] sync failed', error)
  }
}

export async function loadUserBadgesWithSync(
  userId: string,
  input: BadgeComputeInput,
): Promise<BadgeWithEarned[]> {
  const earnedIds = computeEarnedBadgeIds(input)
  await syncComputedBadges(userId, earnedIds)
  return fetchUserBadges(userId)
}

export async function grantManualBadge(
  adminUserId: string,
  targetUserId: string,
  badgeId: ManualGrantBadgeId,
): Promise<void> {
  const client = requireClient()

  const { error } = await client.from('user_badges').upsert(
    {
      user_id: targetUserId,
      badge_id: badgeId,
      source: 'manual',
      granted_by: adminUserId,
    },
    { onConflict: 'user_id,badge_id' },
  )

  if (error) throw error

  await client.from('badge_events').insert({
    user_id: targetUserId,
    badge_id: badgeId,
    event_type: 'earned',
    actor_id: adminUserId,
    details: `Admin granted ${badgeId}`,
  })
}

export async function revokeManualBadge(
  adminUserId: string,
  targetUserId: string,
  badgeId: string,
): Promise<void> {
  const client = requireClient()

  const { error } = await client
    .from('user_badges')
    .delete()
    .eq('user_id', targetUserId)
    .eq('badge_id', badgeId)
    .in('source', ['manual', 'premium'])

  if (error) throw error

  await client.from('badge_events').insert({
    user_id: targetUserId,
    badge_id: badgeId,
    event_type: 'revoked',
    actor_id: adminUserId,
    details: `Admin revoked ${badgeId}`,
  })
}

export function resolveFeaturedBadge(
  badges: BadgeWithEarned[],
  featuredBadgeId: string | null | undefined,
): BadgeWithEarned | null {
  if (!featuredBadgeId) return badges[0] ?? null
  return badges.find((b) => b.id === featuredBadgeId) ?? badges[0] ?? null
}

export function getBadgeFromCatalog(id: string): Badge | undefined {
  return BADGE_BY_ID.get(id)
}
