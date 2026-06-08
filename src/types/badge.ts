export type BadgeCategory = 'collection' | 'set' | 'trade' | 'community' | 'special'

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'special'

export type BadgeSource = 'computed' | 'manual' | 'premium'

export interface Badge {
  id: string
  name: string
  description: string
  category: BadgeCategory
  emoji: string
  tier: BadgeTier
  sort_order: number
  is_manual_only: boolean
  created_at?: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  source: BadgeSource
  granted_by: string | null
  earned_at: string
  badge?: Badge
}

export interface BadgeWithEarned extends Badge {
  earned_at: string
  source: BadgeSource
}

export type LeaderboardMetric =
  | 'cans'
  | 'completion'
  | 'badges'
  | 'trades'
  | 'contributions'

export interface LeaderboardEntry {
  user_id: string
  username: string
  public_display_name: string | null
  avatar_url: string | null
  featured_badge_id: string | null
  score: number
  rank: number
}

export const LEADERBOARD_LABELS: Record<LeaderboardMetric, string> = {
  cans: 'Most Cans',
  completion: 'Highest Completion %',
  badges: 'Most Badges',
  trades: 'Most Trade Listings',
  contributions: 'Master DB Contributions',
}

export const MANUAL_GRANT_BADGE_IDS = ['founder', 'beta_tester', 'community_contributor'] as const

export type ManualGrantBadgeId = (typeof MANUAL_GRANT_BADGE_IDS)[number]
