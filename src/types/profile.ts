export type PremiumStatus = 'free' | 'premium'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  created_at: string
  premium_status: PremiumStatus
  premium_until: string | null
  role: UserRole
  username: string | null
  public_display_name: string | null
  bio: string | null
  country: string | null
  avatar_url: string | null
  is_public_profile: boolean
}

/** Fields exposed on public profile pages (no email). */
export interface PublicProfile {
  id: string
  username: string
  public_display_name: string | null
  bio: string | null
  country: string | null
  avatar_url: string | null
  is_public_profile: boolean
  premium_status: PremiumStatus
  premium_until: string | null
  created_at: string
}

export interface ProfileUpdate {
  display_name?: string | null
  username?: string | null
  public_display_name?: string | null
  bio?: string | null
  country?: string | null
  avatar_url?: string | null
  is_public_profile?: boolean
}

export interface PublicProfileStats {
  totalCans: number
  unopenedCount: number
  tradeCount: number
  wishlistCount: number
  completionPercentage: number
  completionOwned: number
  completionTotal: number
}
