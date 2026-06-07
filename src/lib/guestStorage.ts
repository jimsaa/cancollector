import { isSupabaseConfigured } from './supabase'

/**
 * Runtime flag: when true, cans/trade listings use localStorage (guest).
 * Set by AuthContext on login/logout.
 */
let guestStorageActive = !isSupabaseConfigured

export function setGuestStorageActive(active: boolean): void {
  guestStorageActive = active
}

/** True when collection data should be read/written from localStorage. */
export function useGuestStorage(): boolean {
  if (!isSupabaseConfigured) return true
  return guestStorageActive
}
