import { MASTER_CANS_SEED } from '../data/masterCansSeed'
import type { MasterBrandFilter, MasterCan } from '../types/masterCan'
import { fetchLocalMasterCans } from './localMasterCans'
import { normalizeMasterCan } from './masterCanNormalize'
import { isConfigured } from './mode'
import { useGuestStorage } from './guestStorage'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
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
  if (!isConfigured || useGuestStorage()) {
    return fetchLocalOrSeedMasters(brand)
  }

  const client = requireClient()
  let query = client.from('master_cans').select('*').order('product_name', { ascending: true })

  if (brand !== 'all') {
    query = query.eq('brand', brand)
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as MasterCan[]).map((row) => normalizeMasterCan(row))
}

export async function fetchActiveMasterCans(brand: MasterBrandFilter = 'all'): Promise<MasterCan[]> {
  const all = await fetchMasterCans(brand)
  return all.filter((m) => m.active)
}

/** Seed-only count for display when DB unavailable. */
export function getSeedMasterCanCount(): number {
  return MASTER_CANS_SEED.length
}
