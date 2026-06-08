import { MASTER_CANS_SEED } from '../data/masterCansSeed'
import type { MasterBrandFilter, MasterCan } from '../types/masterCan'
import { fetchLocalMasterCans } from './localMasterCans'
import { normalizeMasterCan } from './masterCanNormalize'
import { isConfigured } from './mode'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

/** PostgREST PGRST205 — table not deployed yet (e.g. master_cans migration not run). */
function isMissingMasterCansTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const record = err as { code?: string; message?: string }
  if (record.code === 'PGRST205') return true
  const msg = (record.message ?? '').toLowerCase()
  return msg.includes('master_cans') && msg.includes('schema cache')
}

function filterBrand(masters: MasterCan[], brand: MasterBrandFilter): MasterCan[] {
  if (brand === 'all') return masters
  return masters.filter((m) => m.brand === brand)
}

async function fetchLocalOrSeedMasters(brand: MasterBrandFilter): Promise<MasterCan[]> {
  const merged = await fetchLocalMasterCans()
  return filterBrand(merged, brand)
}

export async function fetchMasterCans(brand: MasterBrandFilter = 'all'): Promise<MasterCan[]> {
  // Global master DB always comes from Supabase when configured (not guest localStorage).
  if (!isConfigured) {
    return fetchLocalOrSeedMasters(brand)
  }

  const client = requireClient()
  let query = client
    .from('master_cans')
    .select('*')
    .order('product_name', { ascending: true })
    .limit(5000)

  if (brand !== 'all') {
    query = query.eq('brand', brand)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingMasterCansTableError(error)) {
      if (import.meta.env.DEV) {
        console.warn('[masterCans] public.master_cans not found — using bundled seed data')
      }
      return fetchLocalOrSeedMasters(brand)
    }
    throw error
  }

  return ((data ?? []) as MasterCan[]).map((row) => normalizeMasterCan(row))
}

export async function fetchActiveMasterCans(brand: MasterBrandFilter = 'all'): Promise<MasterCan[]> {
  const all = await fetchMasterCans(brand)
  return all.filter((m) => m.active !== false)
}

/** Seed-only count for display when DB unavailable. */
export function getSeedMasterCanCount(): number {
  return MASTER_CANS_SEED.length
}
