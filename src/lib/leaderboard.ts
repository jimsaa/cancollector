import type { LeaderboardEntry, LeaderboardMetric } from '../types/badge'
import { computeCompletionPercent } from './badgeCompute'
import { buildBadgeComputeInput, loadUserBadgesWithSync } from './badges'
import { fetchMasterCans } from './masterCans'
import { fetchPublicCans, fetchPublicTradeListings } from './publicProfiles'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

export async function fetchLeaderboard(metric: LeaderboardMetric, limit = 50): Promise<LeaderboardEntry[]> {
  if (!isConfigured) return []

  if (metric === 'completion') {
    return fetchCompletionLeaderboard(limit)
  }

  const client = requireClient()
  const { data, error } = await client.rpc('get_public_leaderboard', {
    p_metric: metric,
    p_limit: limit,
  })

  if (error) throw error

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    user_id: row.user_id as string,
    username: row.username as string,
    public_display_name: (row.public_display_name as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    featured_badge_id: (row.featured_badge_id as string | null) ?? null,
    score: Number(row.score ?? 0),
    rank: Number(row.rank ?? 0),
  }))
}

async function fetchPublicProfiles(limit: number) {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, username, public_display_name, avatar_url, featured_badge_id, premium_source, is_premium')
    .eq('is_public_profile', true)
    .not('username', 'is', null)
    .limit(limit * 3)

  if (error) throw error
  return data ?? []
}

async function fetchCompletionLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const profiles = await fetchPublicProfiles(limit)
  const masters = await fetchMasterCans('all')

  const scored: LeaderboardEntry[] = []

  for (const profile of profiles) {
    const userId = profile.id as string
    const cans = await fetchPublicCans(userId)
    const listings = await fetchPublicTradeListings(userId)
    const input = await buildBadgeComputeInput(
      userId,
      {
        premium_source: (profile.premium_source as string | null) ?? null,
        is_premium: Boolean(profile.is_premium),
      },
      cans,
      masters,
      listings,
    )
    const pct = computeCompletionPercent(input)

    scored.push({
      user_id: userId,
      username: profile.username as string,
      public_display_name: (profile.public_display_name as string | null) ?? null,
      avatar_url: (profile.avatar_url as string | null) ?? null,
      featured_badge_id: (profile.featured_badge_id as string | null) ?? null,
      score: pct,
      rank: 0,
    })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((row, index) => ({ ...row, rank: index + 1 }))
}

/** Sync badges for all public profiles (call before badges leaderboard for accuracy). */
export async function syncPublicProfileBadges(limit = 30): Promise<void> {
  if (!isConfigured) return

  const profiles = await fetchPublicProfiles(limit)
  const masters = await fetchMasterCans('all')

  for (const profile of profiles) {
    const userId = profile.id as string
    try {
      const cans = await fetchPublicCans(userId)
      const listings = await fetchPublicTradeListings(userId)
      const input = await buildBadgeComputeInput(
        userId,
        {
          premium_source: (profile.premium_source as string | null) ?? null,
          is_premium: Boolean(profile.is_premium),
        },
        cans,
        masters,
        listings,
      )
      await loadUserBadgesWithSync(userId, input)
    } catch {
      // skip failed user
    }
  }
}

export async function fetchLeaderboardWithSync(
  metric: LeaderboardMetric,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (metric === 'badges') {
    await syncPublicProfileBadges(limit)
  }
  return fetchLeaderboard(metric, limit)
}
