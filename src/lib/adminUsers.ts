import type { AdminAction, AdminUserRow, GrantPremiumInput, PremiumSource } from '../types/premium'
import type { UserRole } from '../types/profile'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

async function logAdminAction(
  adminUserId: string,
  targetUserId: string | null,
  action: string,
  details?: string | null,
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('admin_actions').insert({
    admin_user_id: adminUserId,
    target_user_id: targetUserId,
    action,
    details: details ?? null,
  })
  if (error) throw error
}

function normalizeAdminUser(
  row: Record<string, unknown>,
  canCount: number,
): AdminUserRow {
  return {
    id: row.id as string,
    username: (row.username as string | null) ?? null,
    display_name: (row.display_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    created_at: row.created_at as string,
    role: (row.role as UserRole) ?? 'user',
    is_premium: Boolean(row.is_premium),
    premium_source: (row.premium_source as string | null) ?? null,
    premium_expires_at: (row.premium_expires_at as string | null) ?? null,
    premium_notes: (row.premium_notes as string | null) ?? null,
    premium_status: (row.premium_status as 'free' | 'premium') ?? 'free',
    premium_until: (row.premium_until as string | null) ?? null,
    total_cans: canCount,
  }
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  if (!isConfigured) return []

  const client = requireClient()

  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select(
      'id, username, display_name, email, created_at, role, is_premium, premium_source, premium_expires_at, premium_notes, premium_status, premium_until',
    )
    .order('created_at', { ascending: false })

  if (profileError) throw profileError

  const { data: cans, error: cansError } = await client
    .from('cans')
    .select('user_id, quantity, is_wishlist')

  if (cansError) throw cansError

  const counts = new Map<string, number>()
  for (const row of cans ?? []) {
    if (row.is_wishlist) continue
    const uid = row.user_id as string
    counts.set(uid, (counts.get(uid) ?? 0) + Number(row.quantity ?? 1))
  }

  return (profiles ?? []).map((row) =>
    normalizeAdminUser(row as Record<string, unknown>, counts.get(row.id as string) ?? 0),
  )
}

export async function grantPremium(
  adminUserId: string,
  input: GrantPremiumInput,
): Promise<void> {
  const client = requireClient()
  const expiresAt = input.lifetime ? null : input.expiresAt

  const { error } = await client
    .from('profiles')
    .update({
      is_premium: true,
      premium_status: 'premium',
      premium_source: input.premiumSource,
      premium_expires_at: expiresAt,
      premium_until: expiresAt,
      premium_notes: input.notes?.trim() || null,
    })
    .eq('id', input.targetUserId)

  if (error) throw error

  const sourceLabel = input.premiumSource.replace(/_/g, ' ')
  const duration = input.lifetime ? 'Lifetime Premium' : `Premium until ${expiresAt}`
  const handle = await getUsernameForLog(input.targetUserId)
  await logAdminAction(
    adminUserId,
    input.targetUserId,
    'grant_premium',
    `Granted ${duration} (${sourceLabel}) to ${handle}`,
  )
}

export async function removePremium(adminUserId: string, targetUserId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from('profiles')
    .update({
      is_premium: false,
      premium_status: 'free',
      premium_source: null,
      premium_expires_at: null,
      premium_until: null,
      premium_notes: null,
    })
    .eq('id', targetUserId)

  if (error) throw error

  const handle = await getUsernameForLog(targetUserId)
  await logAdminAction(adminUserId, targetUserId, 'remove_premium', `Removed Premium from ${handle}`)
}

export async function setUserRole(
  adminUserId: string,
  targetUserId: string,
  role: UserRole,
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('profiles').update({ role }).eq('id', targetUserId)
  if (error) throw error

  const handle = await getUsernameForLog(targetUserId)
  const verb = role === 'admin' ? 'Granted admin role to' : 'Removed admin role from'
  await logAdminAction(adminUserId, targetUserId, 'set_role', `${verb} ${handle}`)
}

export async function fetchRecentAdminActions(limit = 20): Promise<AdminAction[]> {
  if (!isConfigured) return []

  const client = requireClient()
  const { data, error } = await client
    .from('admin_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AdminAction[]
}

async function getUsernameForLog(userId: string): Promise<string> {
  const client = requireClient()
  const { data } = await client
    .from('profiles')
    .select('username, display_name, email')
    .eq('id', userId)
    .maybeSingle()

  if (!data) return userId.slice(0, 8)
  const row = data as { username?: string | null; display_name?: string | null; email?: string | null }
  return row.username ?? row.display_name ?? row.email ?? userId.slice(0, 8)
}

export function formatPremiumSource(source: string | null): string {
  if (!source) return 'Premium'
  return source
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function isPremiumExpired(row: AdminUserRow): boolean {
  if (!row.is_premium && row.premium_status !== 'premium') return false
  const expires = row.premium_expires_at ?? row.premium_until
  if (!expires) return false
  return new Date(expires) < new Date()
}

export const DEFAULT_PREMIUM_SOURCE: PremiumSource = 'early_tester'
