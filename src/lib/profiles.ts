import type { Profile, ProfileUpdate, UserRole } from '../types/profile'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function normalizeProfile(raw: Record<string, unknown>): Profile {
  const legacyAdmin = raw.is_admin === true
  const role = (raw.role as UserRole | undefined) ?? (legacyAdmin ? 'admin' : 'user')
  return {
    id: raw.id as string,
    display_name: (raw.display_name as string | null) ?? null,
    email: (raw.email as string | null) ?? null,
    created_at: raw.created_at as string,
    premium_status: (raw.premium_status as Profile['premium_status']) ?? 'free',
    premium_until: (raw.premium_until as string | null) ?? null,
    role,
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const client = requireClient()
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data ? normalizeProfile(data as Record<string, unknown>) : null
}

export async function upsertProfile(
  userId: string,
  email: string,
  displayName: string,
): Promise<Profile> {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        display_name: displayName,
        role: 'user',
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) throw error
  return normalizeProfile(data as Record<string, unknown>)
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return normalizeProfile(data as Record<string, unknown>)
}
