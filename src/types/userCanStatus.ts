export type UserCanStatusType = 'got' | 'want' | 'need'

export interface UserCanStatusEntry {
  id: string
  user_id: string
  master_can_id: string
  status: UserCanStatusType
  created_at: string
  updated_at: string
}

export type UserCanStatusMap = Record<string, UserCanStatusType>
