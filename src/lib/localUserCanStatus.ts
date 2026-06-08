import type { UserCanStatusEntry, UserCanStatusMap, UserCanStatusType } from '../types/userCanStatus'
import { generateId } from './id'

const KEY = 'cancollector-user-can-status'

function readAll(): UserCanStatusEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as UserCanStatusEntry[]
  } catch {
    return []
  }
}

function writeAll(rows: UserCanStatusEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(rows))
}

export function fetchLocalUserCanStatus(userId: string): UserCanStatusEntry[] {
  return readAll().filter((row) => row.user_id === userId)
}

export function getLocalUserCanStatusMap(userId: string): UserCanStatusMap {
  const map: UserCanStatusMap = {}
  for (const row of fetchLocalUserCanStatus(userId)) {
    map[row.master_can_id] = row.status
  }
  return map
}

export function setLocalUserCanStatus(
  userId: string,
  masterCanId: string,
  status: UserCanStatusType,
): UserCanStatusEntry {
  const now = new Date().toISOString()
  const rows = readAll()
  const index = rows.findIndex((r) => r.user_id === userId && r.master_can_id === masterCanId)

  if (index >= 0) {
    const updated: UserCanStatusEntry = { ...rows[index], status, updated_at: now }
    rows[index] = updated
    writeAll(rows)
    return updated
  }

  const created: UserCanStatusEntry = {
    id: generateId(),
    user_id: userId,
    master_can_id: masterCanId,
    status,
    created_at: now,
    updated_at: now,
  }
  writeAll([created, ...rows])
  return created
}

export function clearLocalUserCanStatus(userId: string, masterCanId: string): void {
  writeAll(
    readAll().filter((r) => !(r.user_id === userId && r.master_can_id === masterCanId)),
  )
}

export function fetchAllLocalUserCanStatus(): UserCanStatusEntry[] {
  return readAll()
}
