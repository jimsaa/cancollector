export const PREMIUM_SOURCE_PRESETS = [
  { value: 'early_tester', label: 'Early Tester' },
  { value: 'founder', label: 'Founder' },
  { value: 'beta_tester', label: 'Beta Tester' },
  { value: 'community_contributor', label: 'Community Contributor' },
  { value: 'premium', label: 'Premium Collector' },
] as const

export type PremiumSource = (typeof PREMIUM_SOURCE_PRESETS)[number]['value']

export interface PremiumBadge {
  emoji: string
  label: string
}

export interface AdminAction {
  id: string
  admin_user_id: string
  target_user_id: string | null
  action: string
  details: string | null
  created_at: string
}

export interface AdminUserRow {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
  created_at: string
  role: 'user' | 'admin'
  is_premium: boolean
  premium_source: string | null
  premium_expires_at: string | null
  premium_notes: string | null
  premium_status: 'free' | 'premium'
  premium_until: string | null
  total_cans: number
}

export interface GrantPremiumInput {
  targetUserId: string
  lifetime: boolean
  expiresAt: string | null
  premiumSource: PremiumSource
  notes: string | null
}
