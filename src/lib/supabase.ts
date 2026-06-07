import { createClient } from '@supabase/supabase-js'

/** Public Supabase URL — safe for frontend (from VITE_SUPABASE_URL). */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

/** Publishable/anon key only — never use service_role in this app. */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
