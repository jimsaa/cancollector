import { isSupabaseConfigured } from './supabase'

/** True when Supabase env vars are missing — data is stored in localStorage. */
export const isLocalMode = !isSupabaseConfigured
