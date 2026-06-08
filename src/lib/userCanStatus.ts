import type { UserCanStatusEntry, UserCanStatusMap, UserCanStatusType } from '../types/userCanStatus'
import type { MasterCanCommunityCounts } from '../types/masterCan'
import {
  clearLocalUserCanStatus,
  fetchAllLocalUserCanStatus,
  fetchLocalUserCanStatus,
  setLocalUserCanStatus,
} from './localUserCanStatus'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function useLocalStore(): boolean {
  return !isConfigured || useGuestStorage()
}

export async function fetchUserCanStatus(userId: string): Promise<UserCanStatusEntry[]> {
  if (useLocalStore()) return fetchLocalUserCanStatus(userId)

  const client = requireClient()
  const { data, error } = await client
    .from('user_can_status')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as UserCanStatusEntry[]
}

export async function getUserCanStatusMap(userId: string): Promise<UserCanStatusMap> {
  const rows = await fetchUserCanStatus(userId)
  const map: UserCanStatusMap = {}
  for (const row of rows) {
    map[row.master_can_id] = row.status
  }
  return map
}

export async function setUserCanStatus(
  userId: string,
  masterCanId: string,
  status: UserCanStatusType,
): Promise<UserCanStatusEntry> {
  if (useLocalStore()) return setLocalUserCanStatus(userId, masterCanId, status)

  const client = requireClient()
  const { data, error } = await client
    .from('user_can_status')
    .upsert(
      { user_id: userId, master_can_id: masterCanId, status },
      { onConflict: 'user_id,master_can_id' },
    )
    .select()
    .single()

  if (error) throw error
  return data as UserCanStatusEntry
}

export async function clearUserCanStatus(userId: string, masterCanId: string): Promise<void> {
  if (useLocalStore()) {
    clearLocalUserCanStatus(userId, masterCanId)
    return
  }

  const client = requireClient()
  const { error } = await client
    .from('user_can_status')
    .delete()
    .eq('user_id', userId)
    .eq('master_can_id', masterCanId)

  if (error) throw error
}

export async function fetchMasterCanCommunityCounts(
  masterCanId: string,
): Promise<MasterCanCommunityCounts> {
  if (useLocalStore()) {
    const rows = fetchAllLocalUserCanStatus().filter((r) => r.master_can_id === masterCanId)
    return aggregateCounts(rows.map((r) => r.status))
  }

  const client = requireClient()
  const { data, error } = await client
    .from('user_can_status')
    .select('status')
    .eq('master_can_id', masterCanId)

  if (error) throw error
  return aggregateCounts((data ?? []).map((r) => r.status as UserCanStatusType))
}

export async function fetchCommunityCountsForMasters(
  masterIds: string[],
): Promise<Record<string, MasterCanCommunityCounts>> {
  const result: Record<string, MasterCanCommunityCounts> = {}
  for (const id of masterIds) {
    result[id] = { got: 0, want: 0, need: 0 }
  }

  if (masterIds.length === 0) return result

  if (useLocalStore()) {
    for (const row of fetchAllLocalUserCanStatus()) {
      if (!result[row.master_can_id]) continue
      result[row.master_can_id][row.status]++
    }
    return result
  }

  const client = requireClient()
  const { data, error } = await client
    .from('user_can_status')
    .select('master_can_id, status')
    .in('master_can_id', masterIds)

  if (error) throw error

  for (const row of data ?? []) {
    const id = row.master_can_id as string
    const status = row.status as UserCanStatusType
    if (!result[id]) result[id] = { got: 0, want: 0, need: 0 }
    result[id][status]++
  }

  return result
}

function aggregateCounts(statuses: UserCanStatusType[]): MasterCanCommunityCounts {
  return statuses.reduce(
    (acc, status) => {
      acc[status]++
      return acc
    },
    { got: 0, want: 0, need: 0 },
  )
}

export async function fetchUserStatusCounts(userId: string): Promise<{
  got: number
  want: number
  need: number
}> {
  const rows = await fetchUserCanStatus(userId)
  return aggregateCounts(rows.map((r) => r.status))
}
