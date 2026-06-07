export type UserWishlistStatus = 'wanted'

export interface UserWishlistEntry {
  id: string
  user_id: string
  master_can_id: string
  status: UserWishlistStatus
  created_at: string
}
