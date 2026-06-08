import type { CanTradeStatus, ConditionGrade, OpeningStatus, TradeCurrency } from './canCollector'
import type { ImageSource } from './imageSource'

export type { ImageSource } from './imageSource'
export type { CanTradeStatus, ConditionGrade, OpeningStatus, TradeCurrency } from './canCollector'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'unknown'
export type WishlistStatus = 'wanted' | 'missing'

export interface Can {
  id: string
  user_id: string
  master_can_id: string | null
  barcode: string | null
  name: string | null
  brand: string | null
  flavor: string | null
  volume: string | null
  country: string | null
  country_variant: string | null
  image_url: string | null
  image_source: ImageSource
  user_image_url: string | null
  master_image_url: string | null
  off_image_url: string | null
  /** @deprecated Prefer opening_status — kept in sync for filters and legacy data */
  opened: boolean
  opening_status: OpeningStatus
  purchase_date: string | null
  purchase_country: string | null
  purchase_city: string | null
  purchase_store: string | null
  added_date: string
  /** @deprecated Prefer trade_status — kept in sync */
  available_for_trade: boolean
  trade_status: CanTradeStatus
  trade_price: number | null
  trade_currency: TradeCurrency | null
  trade_note: string | null
  is_public: boolean
  show_on_public_profile: boolean
  condition_grade: ConditionGrade
  condition_notes: string | null
  wanted: boolean
  notes: string | null
  rarity: Rarity
  quantity: number
  is_wishlist: boolean
  wishlist_status: WishlistStatus | null
}

export type CanInsert = Omit<Can, 'id' | 'user_id' | 'added_date' | 'master_can_id'> & {
  id?: string
  user_id?: string
  added_date?: string
  master_can_id?: string | null
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
