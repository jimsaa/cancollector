import { isSupabaseConfigured } from './supabase'

/** True when Supabase env vars are missing — data is stored in localStorage. */
export const isLocalMode = !isSupabaseConfigured

/** True when Supabase is configured — auth and cloud storage are used. */
export const isCloudMode = isSupabaseConfigured
