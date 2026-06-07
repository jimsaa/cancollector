import type { MasterCan } from '../types/masterCan'
import type {
  PendingCanSuggestion,
  PendingCanSuggestionInsert,
  PendingSuggestionSource,
  PendingSuggestionStatus,
} from '../types/pendingSuggestion'
import {
  createLocalPendingSuggestion,
  fetchLocalPendingSuggestions,
  updateLocalPendingSuggestion,
} from './localPendingSuggestions'
import { upsertLocalApprovedMasterCan, findLocalMasterByBarcode } from './localMasterCans'
import { linkUserCansToMasterByBarcode } from './masterCanLink'
import { findMasterByBarcode } from './masterCanMatching'
import { fetchActiveMasterCans } from './masterCans'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { normalizeMasterCan } from './masterCanNormalize'
import { generateId } from './id'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function useLocalPendingStore(): boolean {
  return !isConfigured || useGuestStorage()
}

export async function fetchPendingSuggestions(
  status: PendingSuggestionStatus = 'pending',
): Promise<PendingCanSuggestion[]> {
  if (useLocalPendingStore()) return fetchLocalPendingSuggestions(status)

  const client = requireClient()
  const { data, error } = await client
    .from('pending_can_suggestions')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PendingCanSuggestion[]
}

/** Only creates a suggestion when barcode is unknown in the approved master database. */
export async function maybeCreatePendingSuggestion(
  input: PendingCanSuggestionInsert,
): Promise<PendingCanSuggestion | null> {
  const barcode = input.barcode?.trim()
  if (!barcode) return null

  if (useLocalPendingStore()) {
    if (findLocalMasterByBarcode(barcode)) return null
    return createLocalPendingSuggestion(input)
  }

  const masters = await fetchActiveMasterCans('all')
  if (findMasterByBarcode(masters, barcode)) return null

  const client = requireClient()
  const { data: existing } = await client
    .from('pending_can_suggestions')
    .select('id')
    .eq('barcode', barcode)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    const { data, error } = await client
      .from('pending_can_suggestions')
      .update({
        product_name: input.product_name,
        image_url: input.image_url,
        source: input.source,
        submitted_by: input.submitted_by,
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data as PendingCanSuggestion
  }

  const { data, error } = await client
    .from('pending_can_suggestions')
    .insert({ ...input, barcode, status: 'pending' })
    .select()
    .single()

  if (error) throw error
  return data as PendingCanSuggestion
}

export interface ApproveSuggestionInput {
  brand: string
  product_name: string
  flavor?: string | null
  variant_name?: string | null
  volume?: string | null
  country?: string | null
  barcode: string
  image_url?: string | null
  rarity?: MasterCan['rarity']
  release_year?: number | null
  discontinued?: boolean
}

async function upsertCloudMasterCan(master: ApproveSuggestionInput): Promise<MasterCan> {
  const client = requireClient()
  const barcode = master.barcode.trim()
  const payload = {
    brand: master.brand,
    product_name: master.product_name,
    flavor: master.flavor ?? null,
    variant_name: master.variant_name ?? null,
    volume: master.volume ?? null,
    country: master.country ?? null,
    barcode,
    image_url: master.image_url ?? null,
    rarity: master.rarity ?? 'unknown',
    release_year: master.release_year ?? null,
    discontinued: master.discontinued ?? false,
    active: true,
  }

  const { data: existing } = await client
    .from('master_cans')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()

  if (existing) {
    const { data, error } = await client
      .from('master_cans')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return normalizeMasterCan(data as MasterCan)
  }

  const { data, error } = await client.from('master_cans').insert(payload).select().single()
  if (error) throw error
  return normalizeMasterCan(data as MasterCan)
}

export interface ApproveSuggestionResult {
  master: MasterCan
  linkedCans: number
}

export async function approvePendingSuggestion(
  suggestion: PendingCanSuggestion,
  master: ApproveSuggestionInput,
): Promise<ApproveSuggestionResult> {
  let approvedMaster: MasterCan

  if (useLocalPendingStore()) {
    approvedMaster = await upsertLocalApprovedMasterCan({
      id: generateId(),
      brand: master.brand,
      product_name: master.product_name,
      flavor: master.flavor ?? null,
      variant_name: master.variant_name ?? null,
      volume: master.volume ?? null,
      country: master.country ?? null,
      barcode: master.barcode.trim(),
      image_url: master.image_url ?? null,
      rarity: master.rarity ?? 'unknown',
      release_year: master.release_year ?? null,
      discontinued: master.discontinued ?? false,
      active: true,
    })
    updateLocalPendingSuggestion(suggestion.id, { status: 'approved' })
  } else {
    approvedMaster = await upsertCloudMasterCan(master)

    const client = requireClient()
    const { error: updateError } = await client
      .from('pending_can_suggestions')
      .update({ status: 'approved' })
      .eq('id', suggestion.id)

    if (updateError) throw updateError
  }

  const linkedCans = await linkUserCansToMasterByBarcode(
    master.barcode.trim(),
    approvedMaster.id,
  )

  return { master: approvedMaster, linkedCans }
}

/** Reject suggestion only — user collection cans are untouched. */
export async function rejectPendingSuggestion(suggestionId: string): Promise<void> {
  if (useLocalPendingStore()) {
    updateLocalPendingSuggestion(suggestionId, { status: 'rejected' })
    return
  }

  const client = requireClient()
  const { error } = await client
    .from('pending_can_suggestions')
    .update({ status: 'rejected' })
    .eq('id', suggestionId)

  if (error) throw error
}

export function inferSuggestionSource(options: {
  offFound: boolean
  hasUserImage: boolean
}): PendingSuggestionSource {
  if (options.hasUserImage) return 'user_scan'
  if (options.offFound) return 'open_food_facts'
  return 'manual'
}
