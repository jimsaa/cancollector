import type {
  AdminDashboardData,
  AdminRecentCan,
  AdminRecentFeedback,
  AdminRecentUser,
  AdminStatCounts,
  AdminTopCollector,
} from '../types/adminStats'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function startOfTodayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

async function safeCount(run: () => Promise<{ count: number | null; error: unknown }>): Promise<number> {
  try {
    const { count, error } = await run()
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function safeRows<T>(run: () => Promise<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const { data, error } = await run()
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

function buildProfileLookup(
  profiles: Array<{
    id: string
    display_name: string | null
    username: string | null
  }>,
): Map<string, { display_name: string | null; username: string | null }> {
  return new Map(
    profiles.map((p) => [p.id, { display_name: p.display_name, username: p.username }]),
  )
}

function resolveDisplayName(
  lookup: Map<string, { display_name: string | null; username: string | null }>,
  userId: string,
): string | null {
  const row = lookup.get(userId)
  if (!row) return null
  return row.display_name ?? row.username ?? null
}

function aggregateCounts(
  rows: Array<{ user_id: string; quantity?: number | null; is_wishlist?: boolean | null }>,
  excludeWishlist = true,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (excludeWishlist && row.is_wishlist) continue
    const uid = row.user_id
    counts.set(uid, (counts.get(uid) ?? 0) + Number(row.quantity ?? 1))
  }
  return counts
}

function topCollectors(
  counts: Map<string, number>,
  lookup: Map<string, { display_name: string | null; username: string | null }>,
  limit = 5,
): AdminTopCollector[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([user_id, count]) => {
      const profile = lookup.get(user_id)
      return {
        user_id,
        display_name: profile?.display_name ?? null,
        username: profile?.username ?? null,
        count,
      }
    })
}

async function fetchCounts(client: ReturnType<typeof requireClient>): Promise<AdminStatCounts> {
  const today = startOfTodayIso()
  const weekAgo = daysAgoIso(7)

  const [
    totalUsers,
    newUsersToday,
    newUsersLast7Days,
    totalCans,
    cansAddedToday,
    cansAddedLast7Days,
    totalMasterCans,
    pendingMasterSuggestions,
    pendingImageReviews,
    totalFeedback,
    newFeedback,
    activeTradeListings,
    publicProfiles,
  ] = await Promise.all([
    safeCount(async () => {
      const r = await client.from('profiles').select('*', { count: 'exact', head: true })
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo)
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client.from('cans').select('*', { count: 'exact', head: true })
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('cans')
        .select('*', { count: 'exact', head: true })
        .gte('added_date', today)
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('cans')
        .select('*', { count: 'exact', head: true })
        .gte('added_date', weekAgo)
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client.from('master_cans').select('*', { count: 'exact', head: true })
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('pending_can_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('master_cans')
        .select('*', { count: 'exact', head: true })
        .eq('reference_image_status', 'pending')
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client.from('feedback').select('*', { count: 'exact', head: true })
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('trade_listings')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
      return { count: r.count, error: r.error }
    }),
    safeCount(async () => {
      const r = await client
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public_profile', true)
      return { count: r.count, error: r.error }
    }),
  ])

  return {
    totalUsers,
    newUsersToday,
    newUsersLast7Days,
    totalCans,
    cansAddedToday,
    cansAddedLast7Days,
    totalMasterCans,
    pendingMasterSuggestions,
    pendingImageReviews,
    totalFeedback,
    newFeedback,
    activeTradeListings,
    publicProfiles,
  }
}

const EMPTY_DASHBOARD: AdminDashboardData = {
  counts: {
    totalUsers: 0,
    newUsersToday: 0,
    newUsersLast7Days: 0,
    totalCans: 0,
    cansAddedToday: 0,
    cansAddedLast7Days: 0,
    totalMasterCans: 0,
    pendingMasterSuggestions: 0,
    pendingImageReviews: 0,
    totalFeedback: 0,
    newFeedback: 0,
    activeTradeListings: 0,
    publicProfiles: 0,
  },
  newestUsers: [],
  latestCans: [],
  latestFeedback: [],
  pendingTasks: {
    pendingCanSuggestions: 0,
    pendingImageReviews: 0,
    unresolvedFeedback: 0,
  },
  topByCans: [],
  topByFeedback: [],
  topByTradeListings: [],
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  if (!isConfigured) return EMPTY_DASHBOARD

  const client = requireClient()

  const [counts, profileRows, canRows, feedbackRows, tradeRows, newestUserRows, latestCanRows, latestFeedbackRows] =
    await Promise.all([
      fetchCounts(client),
      safeRows(async () => {
        const r = await client.from('profiles').select('id, display_name, username')
        return { data: r.data as Array<{ id: string; display_name: string | null; username: string | null }>, error: r.error }
      }),
      safeRows(async () => {
        const r = await client.from('cans').select('user_id, quantity, is_wishlist')
        return {
          data: r.data as Array<{ user_id: string; quantity: number | null; is_wishlist: boolean | null }>,
          error: r.error,
        }
      }),
      safeRows(async () => {
        const r = await client.from('feedback').select('user_id')
        return { data: r.data as Array<{ user_id: string }>, error: r.error }
      }),
      safeRows(async () => {
        const r = await client.from('trade_listings').select('user_id').eq('active', true)
        return { data: r.data as Array<{ user_id: string }>, error: r.error }
      }),
      safeRows(async () => {
        const r = await client
          .from('profiles')
          .select('id, display_name, email, created_at, is_premium, premium_source')
          .order('created_at', { ascending: false })
          .limit(8)
        return {
          data: r.data as Array<{
            id: string
            display_name: string | null
            email: string | null
            created_at: string
            is_premium: boolean
            premium_source: string | null
          }>,
          error: r.error,
        }
      }),
      safeRows(async () => {
        const r = await client
          .from('cans')
          .select('id, name, barcode, added_date, user_id')
          .order('added_date', { ascending: false })
          .limit(8)
        return {
          data: r.data as Array<{
            id: string
            name: string | null
            barcode: string | null
            added_date: string
            user_id: string
          }>,
          error: r.error,
        }
      }),
      safeRows(async () => {
        const r = await client
          .from('feedback')
          .select('id, type, title, display_name, user_email, status, created_at')
          .order('created_at', { ascending: false })
          .limit(8)
        return {
          data: r.data as Array<{
            id: string
            type: string
            title: string
            display_name: string | null
            user_email: string | null
            status: string
            created_at: string
          }>,
          error: r.error,
        }
      }),
    ])

  const lookup = buildProfileLookup(profileRows)

  const feedbackCounts = new Map<string, number>()
  for (const row of feedbackRows) {
    feedbackCounts.set(row.user_id, (feedbackCounts.get(row.user_id) ?? 0) + 1)
  }

  const tradeCounts = new Map<string, number>()
  for (const row of tradeRows) {
    tradeCounts.set(row.user_id, (tradeCounts.get(row.user_id) ?? 0) + 1)
  }

  const unresolvedFeedback = await safeCount(async () => {
    const r = await client
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'reviewed', 'planned'])
    return { count: r.count, error: r.error }
  })

  const newestUsers: AdminRecentUser[] = newestUserRows.map((row) => ({
    id: row.id,
    display_name: row.display_name,
    email: row.email,
    created_at: row.created_at,
    is_premium: Boolean(row.is_premium),
    premium_source: row.premium_source,
  }))

  const latestCans: AdminRecentCan[] = latestCanRows.map((row) => ({
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    added_date: row.added_date,
    user_id: row.user_id,
    user_display_name: resolveDisplayName(lookup, row.user_id),
  }))

  const latestFeedback: AdminRecentFeedback[] = latestFeedbackRows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    display_name: row.display_name,
    user_email: row.user_email,
    status: row.status,
    created_at: row.created_at,
  }))

  return {
    counts,
    newestUsers,
    latestCans,
    latestFeedback,
    pendingTasks: {
      pendingCanSuggestions: counts.pendingMasterSuggestions,
      pendingImageReviews: counts.pendingImageReviews,
      unresolvedFeedback,
    },
    topByCans: topCollectors(aggregateCounts(canRows), lookup),
    topByFeedback: topCollectors(feedbackCounts, lookup),
    topByTradeListings: topCollectors(tradeCounts, lookup),
  }
}
