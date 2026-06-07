export type PremiumStatus = 'free' | 'premium'

export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  created_at: string
  premium_status: PremiumStatus
  premium_until: string | null
}

export interface ProfileUpdate {
  display_name?: string | null
}
