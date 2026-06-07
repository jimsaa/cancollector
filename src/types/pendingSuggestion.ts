export type PendingSuggestionStatus = 'pending' | 'approved' | 'rejected'

export type PendingSuggestionSource =
  | 'open_food_facts'
  | 'user_scan'
  | 'manual'
  | 'master_database'

export interface PendingCanSuggestion {
  id: string
  barcode: string
  product_name: string | null
  image_url: string | null
  source: PendingSuggestionSource
  submitted_by: string | null
  created_at: string
  status: PendingSuggestionStatus
}

export type PendingCanSuggestionInsert = Omit<PendingCanSuggestion, 'id' | 'created_at' | 'status'> & {
  id?: string
  created_at?: string
  status?: PendingSuggestionStatus
}
