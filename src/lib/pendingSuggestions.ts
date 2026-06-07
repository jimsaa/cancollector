import type { OfficialProductImportRecord } from '../types/officialProductImport'
import type { MasterCan } from '../types/masterCan'
import type { MasterImageSource } from '../types/masterImageSource'
import type {
  PendingCanSuggestion,
  PendingCanSuggestionInsert,
  PendingSuggestionSource,
  PendingSuggestionStatus,
} from '../types/pendingSuggestion'
import { createLocalOfficialPendingSuggestions } from './localOfficialProductImport'
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

export async function importOfficialProductsToPending(
  products: OfficialProductImportRecord[],
): Promise<number> {
  if (useLocalPendingStore()) {
    return createLocalOfficialPendingSuggestions(products)
  }

  const client = requireClient()
  let imported = 0

  for (const product of products) {
    const pageUrl = product.product_page_url.trim()
    const nameKey = product.product_name.trim()

    const { data: existingByUrl } = await client
      .from('pending_can_suggestions')
      .select('id')
      .eq('status', 'pending')
      .eq('product_page_url', pageUrl)
      .maybeSingle()

    if (existingByUrl) continue

    const { data: existingByName } = await client
      .from('pending_can_suggestions')
      .select('id')
      .eq('status', 'pending')
      .ilike('product_name', nameKey)
      .maybeSingle()

    if (existingByName) continue

    const { data: existingMaster } = await client
      .from('master_cans')
      .select('id')
      .eq('source_url', pageUrl)
      .maybeSingle()

    if (existingMaster) continue

    const row: PendingCanSuggestionInsert = {
      barcode: null,
      product_name: product.product_name,
      brand: product.brand,
      category: product.category,
      flavor: product.flavor,
      variant_name: product.flavor,
      volume: null,
      country: 'US',
      image_url: product.image_url,
      product_page_url: pageUrl,
      source_url: pageUrl,
      source: 'official_site',
      submitted_by: null,
    }

    const { error } = await client.from('pending_can_suggestions').insert({ ...row, status: 'pending' })
    if (error) throw error
    imported++
  }

  return imported
}

export interface ApproveSuggestionInput {
  brand: string
  product_name: string
  flavor?: string | null
  variant_name?: string | null
  volume?: string | null
  country?: string | null
  category?: string | null
  barcode?: string | null
  reference_image_url?: string | null
  image_url?: string | null
  image_source?: MasterImageSource | null
  source?: string | null
  source_url?: string | null
  rarity?: MasterCan['rarity']
  release_year?: number | null
  discontinued?: boolean
}

async function findCloudMasterBySourceUrl(sourceUrl: string): Promise<MasterCan | null> {
  const client = requireClient()
  const { data } = await client
    .from('master_cans')
    .select('*')
    .eq('source_url', sourceUrl.trim())
    .maybeSingle()
  return data ? normalizeMasterCan(data as MasterCan) : null
}

async function upsertCloudMasterCan(master: ApproveSuggestionInput): Promise<MasterCan> {
  const client = requireClient()
  const barcode = master.barcode?.trim() ?? null
  const sourceUrl = master.source_url?.trim() ?? null

  const reference_image_url =
    master.reference_image_url?.trim() || master.image_url?.trim() || null
  const image_source: MasterImageSource =
    master.image_source ??
    (master.source === 'official_site'
      ? 'official_site'
      : reference_image_url
        ? 'manual'
        : 'placeholder')

  const payload = {
    brand: master.brand,
    product_name: master.product_name,
    flavor: master.flavor ?? null,
    variant_name: master.variant_name ?? null,
    volume: master.volume ?? null,
    country: master.country ?? null,
    category: master.category ?? null,
    barcode,
    reference_image_url,
    image_url: reference_image_url,
    image_source,
    source: master.source ?? null,
    source_url: sourceUrl,
    rarity: master.rarity ?? 'unknown',
    release_year: master.release_year ?? null,
    discontinued: master.discontinued ?? false,
    active: true,
  }

  if (sourceUrl) {
    const existingByUrl = await findCloudMasterBySourceUrl(sourceUrl)
    if (existingByUrl) {
      const { data, error } = await client
        .from('master_cans')
        .update(payload)
        .eq('id', existingByUrl.id)
        .select()
        .single()
      if (error) throw error
      return normalizeMasterCan(data as MasterCan)
    }
  }

  if (barcode) {
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
  const barcode = master.barcode?.trim() ?? ''

  if (useLocalPendingStore()) {
    approvedMaster = await upsertLocalApprovedMasterCan({
      id: generateId(),
      brand: master.brand,
      product_name: master.product_name,
      flavor: master.flavor ?? null,
      variant_name: master.variant_name ?? null,
      volume: master.volume ?? null,
      country: master.country ?? null,
      category: master.category ?? null,
      barcode: barcode || null,
      reference_image_url:
        master.reference_image_url?.trim() || master.image_url?.trim() || null,
      image_url: master.reference_image_url?.trim() || master.image_url?.trim() || null,
      image_source:
        master.image_source ??
        (suggestion.source === 'official_site' ? 'official_site' : null),
      source: master.source ?? suggestion.source ?? null,
      source_url: master.source_url ?? suggestion.source_url ?? suggestion.product_page_url ?? null,
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

  const linkedCans = barcode
    ? await linkUserCansToMasterByBarcode(barcode, approvedMaster.id)
    : 0

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
