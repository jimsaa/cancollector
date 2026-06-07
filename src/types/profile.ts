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
}

export interface ProfileUpdate {
  display_name?: string | null
}
