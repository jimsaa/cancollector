export interface AdminStatCounts {
  totalUsers: number
  newUsersToday: number
  newUsersLast7Days: number
  totalCans: number
  cansAddedToday: number
  cansAddedLast7Days: number
  totalMasterCans: number
  pendingMasterSuggestions: number
  pendingImageReviews: number
  totalFeedback: number
  newFeedback: number
  activeTradeListings: number
  publicProfiles: number
}

export interface AdminRecentUser {
  id: string
  display_name: string | null
  email: string | null
  created_at: string
  is_premium: boolean
  premium_source: string | null
}

export interface AdminRecentCan {
  id: string
  name: string | null
  barcode: string | null
  added_date: string
  user_id: string
  user_display_name: string | null
}

export interface AdminRecentFeedback {
  id: string
  type: string
  title: string
  display_name: string | null
  user_email: string | null
  status: string
  created_at: string
}

export interface AdminPendingTasks {
  pendingCanSuggestions: number
  pendingImageReviews: number
  unresolvedFeedback: number
}

export interface AdminTopCollector {
  user_id: string
  display_name: string | null
  username: string | null
  count: number
}

export interface AdminDashboardData {
  counts: AdminStatCounts
  newestUsers: AdminRecentUser[]
  latestCans: AdminRecentCan[]
  latestFeedback: AdminRecentFeedback[]
  pendingTasks: AdminPendingTasks
  topByCans: AdminTopCollector[]
  topByFeedback: AdminTopCollector[]
  topByTradeListings: AdminTopCollector[]
}
