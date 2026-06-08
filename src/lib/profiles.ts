import type { Profile, ProfileUpdate, UserRole } from '../types/profile'
import { formatSupabaseError, logAuthError } from './supabaseDebug'
import { supabase } from './supabase'

const PUBLIC_PROFILE_COLUMNS = [
  'username',
  'public_display_name',
  'bio',
  'country',
  'avatar_url',
  'is_public_profile',
  'featured_can_id',
  'featured_badge_id',
] as const

function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const record = err as { code?: string; message?: string }
  if (record.code === 'PGRST204') return true
  const msg = (record.message ?? '').toLowerCase()
  return msg.includes('column') && (msg.includes('does not exist') || msg.includes('could not find'))
}

function formatProfileError(err: unknown, fallback = 'Could not save profile'): string {
  if (isMissingColumnError(err)) {
    return 'Profile settings are not available yet — run supabase/migration-public-profiles.sql and migration-featured-can.sql in your Supabase SQL editor, then try again.'
  }
  return formatSupabaseError(err, fallback)
}

function stripPublicProfileColumns(updates: ProfileUpdate): ProfileUpdate {
  const next = { ...updates }
  for (const key of PUBLIC_PROFILE_COLUMNS) {
    delete next[key as keyof ProfileUpdate]
  }
  return next
}

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function normalizeProfile(raw: Record<string, unknown>): Profile {
  const legacyAdmin = raw.is_admin === true
  const role = (raw.role as UserRole | undefined) ?? (legacyAdmin ? 'admin' : 'user')
  const username = raw.username as string | null | undefined
  return {
    id: raw.id as string,
    display_name: (raw.display_name as string | null) ?? null,
    email: (raw.email as string | null) ?? null,
    created_at: raw.created_at as string,
    premium_status: (raw.premium_status as Profile['premium_status']) ?? 'free',
    premium_until: (raw.premium_until as string | null) ?? null,
    is_premium: Boolean(raw.is_premium),
    premium_source: (raw.premium_source as string | null) ?? null,
    premium_expires_at: (raw.premium_expires_at as string | null) ?? null,
    premium_notes: (raw.premium_notes as string | null) ?? null,
    role,
    username: username ? username.toLowerCase() : null,
    public_display_name: (raw.public_display_name as string | null) ?? null,
    bio: (raw.bio as string | null) ?? null,
    country: (raw.country as string | null) ?? null,
    avatar_url: (raw.avatar_url as string | null) ?? null,
    is_public_profile: Boolean(raw.is_public_profile),
    featured_can_id: (raw.featured_can_id as string | null) ?? null,
    featured_badge_id: (raw.featured_badge_id as string | null) ?? null,
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
): Promise<Profile | null> {
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
    .maybeSingle()

  if (error) throw error
  if (data) return normalizeProfile(data as Record<string, unknown>)

  return fetchProfile(userId)
}

export async function ensureProfile(
  userId: string,
  email: string,
  displayName: string,
): Promise<{ profile: Profile | null; failed: boolean }> {
  try {
    const existing = await fetchProfile(userId)
    if (existing) {
      const needsUpdate = Boolean(displayName && existing.display_name !== displayName)

      if (needsUpdate) {
        try {
          const updated = await updateProfile(userId, {
            display_name: displayName || existing.display_name,
          })
          return { profile: updated, failed: false }
        } catch (updateErr) {
          logAuthError('PROFILE_ERROR', updateErr)
          return { profile: existing, failed: false }
        }
      }
      return { profile: existing, failed: false }
    }

    const created = await upsertProfile(userId, email, displayName)
    if (created) return { profile: created, failed: false }

    const afterUpsert = await fetchProfile(userId)
    return { profile: afterUpsert, failed: !afterUpsert }
  } catch (err) {
    logAuthError('PROFILE_ERROR', err)
    const fallback = await fetchProfile(userId).catch(() => null)
    return { profile: fallback, failed: !fallback }
  }
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const client = requireClient()
  const payload = { ...updates }
  if (payload.username) {
    payload.username = payload.username.trim().toLowerCase()
  }

  const runUpdate = async (body: ProfileUpdate) => {
    const { data, error } = await client
      .from('profiles')
      .update(body)
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) throw error
    if (data) return normalizeProfile(data as Record<string, unknown>)

    const refreshed = await fetchProfile(userId)
    if (refreshed) return refreshed

    throw new Error('Profile update did not apply — sign out and back in, then try again.')
  }

  try {
    return await runUpdate(payload)
  } catch (err) {
    if (!isMissingColumnError(err)) {
      throw new Error(formatProfileError(err))
    }

    const fallback = stripPublicProfileColumns(payload)
    if (Object.keys(fallback).length === 0) {
      throw new Error(formatProfileError(err))
    }

    try {
      return await runUpdate(fallback)
    } catch (fallbackErr) {
      throw new Error(formatProfileError(fallbackErr))
    }
  }
}
