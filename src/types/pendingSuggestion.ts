export type PendingSuggestionStatus = 'pending' | 'approved' | 'rejected'



export type PendingSuggestionSource =

  | 'open_food_facts'

  | 'user_scan'

  | 'manual'

  | 'master_database'

  | 'official_site'



export interface PendingCanSuggestion {

  id: string

  barcode: string | null

  product_name: string | null

  brand: string | null

  category: string | null

  flavor: string | null

  variant_name: string | null

  volume: string | null

  country: string | null

  image_url: string | null

  product_page_url: string | null

  source_url: string | null

  source: PendingSuggestionSource

  submitted_by: string | null

  created_at: string

  status: PendingSuggestionStatus

}



export type PendingCanSuggestionInsert = {
  source: PendingSuggestionSource
  barcode?: string | null
  product_name?: string | null
  brand?: string | null
  category?: string | null
  flavor?: string | null
  variant_name?: string | null
  volume?: string | null
  country?: string | null
  image_url?: string | null
  product_page_url?: string | null
  source_url?: string | null
  submitted_by?: string | null
  id?: string
  created_at?: string
  status?: PendingSuggestionStatus
}


