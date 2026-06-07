export type Rarity = 'common' | 'uncommon' | 'rare' | 'unknown'
export type WishlistStatus = 'wanted' | 'missing'

export interface Can {
  id: string
  user_id: string
  barcode: string | null
  name: string | null
  brand: string | null
  flavor: string | null
  volume: string | null
  country: string | null
  country_variant: string | null
  image_url: string | null
  opened: boolean
  purchase_date: string | null
  added_date: string
  available_for_trade: boolean
  notes: string | null
  rarity: Rarity
  quantity: number
  is_wishlist: boolean
  wishlist_status: WishlistStatus | null
}

export type CanInsert = Omit<Can, 'id' | 'user_id' | 'added_date'> & {
  id?: string
  user_id?: string
  added_date?: string
}

export type CanUpdate = Partial<Omit<Can, 'id' | 'user_id' | 'added_date'>>

export interface ProductLookup {
  barcode: string
  name: string | null
  brand: string | null
  flavor: string | null
  volume: string | null
  country: string | null
  image_url: string | null
}

export type SortOption = 'newest' | 'oldest' | 'name'

export interface CanFilters {
  search: string
  opened: 'all' | 'opened' | 'unopened'
  trade: 'all' | 'yes' | 'no'
  rarity: Rarity | 'all'
  country: string
  sort: SortOption
}

export interface CollectionBackup {
  version: 1
  exported_at: string
  cans: Can[]
}
