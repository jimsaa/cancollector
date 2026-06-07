import type { Profile, ProfileUpdate } from '../types/profile'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const client = requireClient()
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data as Profile | null
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
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) throw error
  return data as Profile
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
  return data as Profile
}
