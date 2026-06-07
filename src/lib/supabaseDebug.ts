import type { AuthErrorLabel } from '../types/auth'
import { isSupabaseConfigured, supabase } from './supabase'

export interface SupabaseEnvStatus {
  urlLoaded: boolean
  keyLoaded: boolean
  clientInitialized: boolean
}

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  return {
    urlLoaded: Boolean(url?.trim()),
    keyLoaded: Boolean(key?.trim()),
    clientInitialized: isSupabaseConfigured && supabase !== null,
  }
}

export function formatSupabaseError(err: unknown, fallback = 'Unknown error'): string {
  if (err instanceof Error && err.message) return err.message

  if (typeof err === 'object' && err !== null) {
    const record = err as Record<string, unknown>
    if (typeof record.message === 'string' && record.message) return record.message
    if (typeof record.error_description === 'string') return record.error_description
    if (typeof record.msg === 'string') return record.msg
    if (typeof record.error === 'string') return record.error
    if (typeof record.details === 'string') return record.details
    if (typeof record.hint === 'string' && typeof record.message === 'string') {
      return `${record.message} (${record.hint})`
    }
  }

  if (typeof err === 'string' && err) return err
  return fallback
}

export function logAuthError(label: AuthErrorLabel, err: unknown): void {
  if (!import.meta.env.DEV) return
  console.error(`[${label}]`, err)
  try {
    console.error(`[${label}] (json)`, JSON.stringify(err, null, 2))
  } catch {
    // ignore circular refs
  }
}

/** @deprecated Use logAuthError with a label */
export function logSupabaseError(context: string, err: unknown): void {
  if (!import.meta.env.DEV) return
  console.error(`[Supabase] ${context}`, err)
  try {
    console.error(`[Supabase] ${context} (json)`, JSON.stringify(err, null, 2))
  } catch {
    // ignore circular refs
  }
}

export interface SupabaseConnectionTestResult {
  success: boolean
  message: string
}

/** Dev-only connectivity check — not exposed in production UI. */
export async function testSupabaseConnection(): Promise<SupabaseConnectionTestResult> {
  const env = getSupabaseEnvStatus()

  if (import.meta.env.DEV) {
    console.info('[Supabase] Env status', env)
  }

  if (!env.urlLoaded || !env.keyLoaded) {
    return {
      success: false,
      message: 'Cloud configuration is incomplete.',
    }
  }

  if (!supabase) {
    return {
      success: false,
      message: 'Cloud client failed to initialize.',
    }
  }

  const { error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    logSupabaseError('testConnection.getSession', sessionError)
    return {
      success: false,
      message: `Auth error: ${formatSupabaseError(sessionError)}`,
    }
  }

  const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
  if (dbError) {
    logSupabaseError('testConnection.profiles', dbError)
    return {
      success: false,
      message: `Database error: ${formatSupabaseError(dbError)}`,
    }
  }

  return {
    success: true,
    message: 'Connected successfully.',
  }
}
