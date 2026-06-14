import type { MatchReport, MatchReportInsert, MatchReportUpdate } from '../types/matchReport'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

export async function submitMatchReport(
  userId: string,
  input: MatchReportInsert,
): Promise<MatchReport> {
  if (!isConfigured) {
    throw new Error('Match reports require cloud sync')
  }

  const client = requireClient()
  const { data, error } = await client
    .from('match_reports')
    .insert({
      user_id: userId,
      barcode: input.barcode.trim(),
      matched_master_can_id: input.matched_master_can_id ?? null,
      suggested_master_can_id: input.suggested_master_can_id ?? null,
      off_product_name: input.off_product_name?.trim() || null,
      comment: input.comment?.trim() || null,
      status: 'new',
    })
    .select()
    .single()

  if (error) throw error
  return data as MatchReport
}

export async function fetchAdminMatchReports(): Promise<MatchReport[]> {
  if (!isConfigured) return []

  const client = requireClient()
  const { data, error } = await client
    .from('match_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as MatchReport[]
}

export async function fetchNewMatchReportCount(): Promise<number> {
  if (!isConfigured) return 0

  const client = requireClient()
  const { count, error } = await client
    .from('match_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  if (error) return 0
  return count ?? 0
}

export async function updateMatchReport(id: string, patch: MatchReportUpdate): Promise<MatchReport> {
  const client = requireClient()
  const { data, error } = await client
    .from('match_reports')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as MatchReport
}
