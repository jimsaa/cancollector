import { isSupabaseConfigured } from './supabase'

/** Supabase env vars are present — accounts and cloud sync are available. */
export const isConfigured = isSupabaseConfigured

/** @deprecated Use useGuestStorage() for storage; this only means Supabase is not configured. */
export const isLocalMode = !isSupabaseConfigured

/** @deprecated Use isConfigured */
export const isCloudMode = isSupabaseConfigured
