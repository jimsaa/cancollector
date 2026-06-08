import type { CollectionSetProgress } from './collectionSet'

export type PremiumStatus = 'free' | 'premium'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  created_at: string
  premium_status: PremiumStatus
  premium_until: string | null
  is_premium: boolean
  premium_source: string | null
  premium_expires_at: string | null
  premium_notes: string | null
  role: UserRole
  username: string | null
  public_display_name: string | null
  bio: string | null
  country: string | null
  avatar_url: string | null
  is_public_profile: boolean
  featured_can_id: string | null
  featured_badge_id: string | null
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
  is_premium: boolean
  premium_source: string | null
  premium_expires_at: string | null
  featured_can_id: string | null
  featured_badge_id: string | null
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
  featured_can_id?: string | null
  featured_badge_id?: string | null
}

export interface PublicProfileStats {
  totalCans: number
  unopenedCount: number
  tradeCount: number
  wishlistCount: number
  activeTradeListings: number
  countriesRepresented: number
  brandsCollected: number
  duplicates: number
  rareCans: number
  completionPercentage: number
  completionOwned: number
  completionTotal: number
  missingCount: number
  needCount: number
  wantCount: number
  setProgress: CollectionSetProgress[]
  featuredSet: CollectionSetProgress | null
}
