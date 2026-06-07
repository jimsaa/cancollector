export type TradeMatchType = 'barcode' | 'master_can' | 'brand_flavor'

export type TradeMatchStatus = 'suggested' | 'viewed' | 'dismissed' | 'saved'



export type TradeCondition = 'mint' | 'excellent' | 'good' | 'damaged' | 'opened' | 'unknown'

export type TradeListingStatus = 'available' | 'reserved' | 'completed' | 'hidden'



export const TRADE_CONDITIONS: TradeCondition[] = [

  'mint',

  'excellent',

  'good',

  'damaged',

  'opened',

  'unknown',

]



export const TRADE_LISTING_STATUSES: TradeListingStatus[] = [

  'available',

  'reserved',

  'completed',

  'hidden',

]



export interface TradeProfile {

  user_id: string

  matching_enabled: boolean

  public_trade_list: boolean

  created_at: string

  updated_at: string

}



export interface TradeListing {

  id: string

  user_id: string

  can_id: string

  title: string

  description: string

  condition: TradeCondition

  trade_status: TradeListingStatus

  asking_for: string

  location_country: string | null

  location_city: string | null

  shipping_available: boolean

  local_pickup_available: boolean

  extra_image_urls: string[]

  youtube_url: string | null

  master_can_id: string | null

  barcode: string | null

  brand: string | null

  product_name: string | null

  flavor: string | null

  volume: string | null

  region: string | null

  quantity: number

  opened: boolean

  active: boolean

  created_at: string

  updated_at: string

}



export type TradeListingUpdate = Partial<

  Pick<

    TradeListing,

    | 'title'

    | 'description'

    | 'condition'

    | 'trade_status'

    | 'asking_for'

    | 'location_country'

    | 'location_city'

    | 'shipping_available'

    | 'local_pickup_available'

    | 'extra_image_urls'

    | 'youtube_url'

  >

>



export interface TradeWant {

  id: string

  user_id: string

  can_id: string | null

  master_can_id: string | null

  barcode: string | null

  brand: string | null

  product_name: string | null

  flavor: string | null

  volume: string | null

  region: string | null

  priority: number

  active: boolean

  created_at: string

  updated_at: string

}



export interface TradeMatchCandidate {

  id: string

  seeker_user_id: string

  offerer_user_id: string

  want_id: string

  listing_id: string

  match_type: TradeMatchType

  match_score: number

  status: TradeMatchStatus

  created_at: string

  updated_at: string

}



/** Client-side match preview (no messaging yet). */

export interface TradeMatchPreview {

  want: TradeWant

  listing: TradeListing

  matchType: TradeMatchType

  matchScore: number

  offererUserId: string

}



export function isListingPubliclyVisible(listing: TradeListing): boolean {

  return listing.trade_status === 'available' && listing.active

}



export function isListingActive(listing: TradeListing): boolean {
  return listing.trade_status === 'available' || listing.trade_status === 'reserved'
}

export function filterActiveTradeListings(listings: TradeListing[]): TradeListing[] {
  return listings.filter(isListingActive)
}


