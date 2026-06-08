import type { PremiumBadge } from '../types/premium'
import type { Profile, PublicProfile } from '../types/profile'
import { isPremiumActive } from './premium'

type PremiumProfile = Pick<
  Profile | PublicProfile,
  | 'is_premium'
  | 'premium_source'
  | 'premium_expires_at'
  | 'premium_until'
  | 'premium_status'
>

const SOURCE_BADGES: Record<string, PremiumBadge> = {
  founder: { emoji: '👑', label: 'Founder' },
  beta_tester: { emoji: '🧪', label: 'Beta Tester' },
  early_tester: { emoji: '⭐', label: 'Early Tester' },
  community_contributor: { emoji: '⭐', label: 'Community Contributor' },
  premium: { emoji: '👑', label: 'Premium Collector' },
}

export function getPremiumBadge(profile: PremiumProfile | null | undefined): PremiumBadge | null {
  if (!profile || !isPremiumActive(profile)) return null

  const source = profile?.premium_source?.trim().toLowerCase()
  if (source && SOURCE_BADGES[source]) return SOURCE_BADGES[source]

  return { emoji: '⭐', label: 'Premium' }
}

export function getPremiumStatusLabel(profile: PremiumProfile | null | undefined): string {
  const badge = getPremiumBadge(profile)
  if (badge) return `${badge.emoji} ${badge.label}`
  return 'Free Collector'
}

export function getDashboardPremiumLabel(profile: PremiumProfile | null | undefined): string {
  if (!profile || !isPremiumActive(profile)) return 'Free Collector'

  const source = profile?.premium_source?.trim().toLowerCase()
  if (source === 'founder') return 'Founder'
  if (source === 'beta_tester') return 'Beta Tester'
  if (source === 'early_tester') return 'Early Tester'
  if (source === 'community_contributor') return 'Community Contributor'
  return 'Premium Collector'
}
