import type { OfficialProductImportRecord } from '../types/officialProductImport'
import type { MasterBarcodeSource, MasterCan } from '../types/masterCan'
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
  findLocalPendingByBarcode,
  updateLocalPendingSuggestion,
} from './localPendingSuggestions'
import {
  attachBarcodeToLocalMasterCan,
  findLocalExistingMaster,
  upsertLocalApprovedMasterCan,
  findLocalMasterByBarcode,
} from './localMasterCans'
import { linkUserCansToMasterByBarcode } from './masterCanLink'
import { findMasterByBarcode } from './masterCanMatching'
import {
  findBarcodelessMasterMatches,
  pickMasterByProductIdentity,
  type MasterCanProductMatch,
} from './masterCanProductMatch'
import { fetchActiveMasterCans } from './masterCans'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { normalizeMasterCan } from './masterCanNormalize'
import { buildMasterReferencePayload, toMasterCanReferenceFields } from './masterReferencePayload'
import {
  formatMasterCanError,
  isBarcodeDuplicateError,
  isDuplicateKeyError,
  normalizeMasterBarcode,
  shouldRetryMasterCanWithoutExtendedColumns,
  stripExtendedMasterColumns,
} from './masterCanSupabase'
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
  return ((data ?? []) as PendingCanSuggestion[]).map((row) => ({
    ...row,
    suggestion_type: row.suggestion_type ?? 'new_master',
    suggested_master_can_id: row.suggested_master_can_id ?? null,
  }))
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

export async function maybeCreateBarcodeLinkSuggestion(input: {
  barcode: string
  product_name: string
  suggested_master_can_id: string
  submitted_by: string | null
  brand?: string | null
  flavor?: string | null
}): Promise<PendingCanSuggestion | null> {
  const barcode = input.barcode?.trim()
  const masterId = input.suggested_master_can_id?.trim()
  if (!barcode || !masterId) return null

  const row: PendingCanSuggestionInsert = {
    barcode,
    product_name: input.product_name,
    brand: input.brand ?? null,
    flavor: input.flavor ?? null,
    source: 'user_scan',
    submitted_by: input.submitted_by,
    suggestion_type: 'attach_barcode',
    suggested_master_can_id: masterId,
  }

  if (useLocalPendingStore()) {
    if (findLocalMasterByBarcode(barcode)) return null
    const existing = findLocalPendingByBarcode(barcode)
    if (existing?.suggestion_type === 'attach_barcode') {
      return updateLocalPendingSuggestion(existing.id, {
        product_name: row.product_name,
        suggested_master_can_id: masterId,
      })
    }
    return createLocalPendingSuggestion(row)
  }

  const masters = await fetchActiveMasterCans('all')
  if (findMasterByBarcode(masters, barcode)) return null

  const client = requireClient()
  const { data: existing } = await client
    .from('pending_can_suggestions')
    .select('id')
    .eq('barcode', barcode)
    .eq('status', 'pending')
    .eq('suggestion_type', 'attach_barcode')
    .maybeSingle()

  if (existing) {
    const { data, error } = await client
      .from('pending_can_suggestions')
      .update({
        product_name: input.product_name,
        suggested_master_can_id: masterId,
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
    .insert({ ...row, status: 'pending' })
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

function isRealExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Only store real external URLs — never user_scan/OFF pseudo-links in source_url. */
export function resolveMasterSourceUrl(
  rawUrl: string | null | undefined,
  source: string | null | undefined,
): string | null {
  const trimmed = rawUrl?.trim() ?? ''
  if (!trimmed || !isRealExternalUrl(trimmed)) return null

  const src = source ?? ''
  if (src === 'user_scan' || src === 'open_food_facts' || src === 'master_database') {
    return null
  }

  return trimmed
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

async function findCloudMasterByBarcode(barcode: string): Promise<MasterCan | null> {
  const client = requireClient()
  const { data } = await client
    .from('master_cans')
    .select('*')
    .eq('barcode', barcode.trim())
    .maybeSingle()
  return data ? normalizeMasterCan(data as MasterCan) : null
}

async function findCloudMasterByProductIdentity(
  brand: string,
  productName: string,
  flavor?: string | null,
  category?: string | null,
): Promise<MasterCan | null> {
  const client = requireClient()
  const { data } = await client
    .from('master_cans')
    .select('*')
    .ilike('brand', brand.trim())
    .ilike('product_name', productName.trim())
    .limit(5)

  const candidates = (data ?? []).map((row) => normalizeMasterCan(row as MasterCan))
  return pickMasterByProductIdentity(candidates, {
    brand,
    product_name: productName,
    flavor,
    category,
  })
}

function sanitizeMasterCanWritePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const row = { ...payload }
  const barcode = normalizeMasterBarcode(row.barcode as string | null | undefined)
  if (barcode) {
    row.barcode = barcode
  } else {
    delete row.barcode
  }
  if (!row.source_url) {
    delete row.source_url
  }
  return row
}

async function findExistingCloudMasterCan(
  master: ApproveSuggestionInput,
  sourceUrl: string | null,
): Promise<MasterCan | null> {
  if (sourceUrl) {
    const byUrl = await findCloudMasterBySourceUrl(sourceUrl)
    if (byUrl) return byUrl
  }

  const brand = master.brand?.trim()
  const productName = master.product_name?.trim()
  if (brand && productName) {
    const byIdentity = await findCloudMasterByProductIdentity(
      brand,
      productName,
      master.flavor,
      master.category,
    )
    if (byIdentity) return byIdentity
  }

  const barcode = normalizeMasterBarcode(master.barcode)
  if (barcode) {
    return findCloudMasterByBarcode(barcode)
  }

  return null
}

function normalizeMasterSource(source: string | null | undefined): string | null {
  if (!source) return null
  if (source === 'user_scan' || source === 'open_food_facts' || source === 'master_database') {
    return 'manual'
  }
  return source
}

function buildMasterCanPayload(
  master: ApproveSuggestionInput,
  sourceUrl: string | null,
  adminApproved: boolean,
): Record<string, unknown> {
  const barcode = normalizeMasterBarcode(master.barcode)
  const referenceFields = toMasterCanReferenceFields(
    buildMasterReferencePayload({
      reference_image_url: master.reference_image_url,
      image_url: master.image_url,
      image_source: master.image_source,
      source: master.source,
      adminApproved,
    }),
  )

  const payload: Record<string, unknown> = {
    brand: master.brand,
    product_name: master.product_name,
    flavor: master.flavor ?? null,
    variant_name: master.variant_name ?? null,
    volume: master.volume ?? null,
    country: master.country ?? null,
    category: master.category ?? null,
    ...(barcode ? { barcode } : {}),
    ...referenceFields,
    source: normalizeMasterSource(master.source),
    rarity: master.rarity ?? 'unknown',
    release_year: master.release_year ?? null,
    discontinued: master.discontinued ?? false,
    active: true,
  }

  if (sourceUrl) {
    payload.source_url = sourceUrl
  }

  return payload
}

async function writeCloudMasterCan(
  payload: Record<string, unknown>,
  match: { type: 'id'; id: string } | { type: 'insert' },
): Promise<MasterCan> {
  const client = requireClient()
  let row = sanitizeMasterCanWritePayload(payload)

  for (let attempt = 0; attempt < 2; attempt++) {
    const result =
      match.type === 'insert'
        ? await client.from('master_cans').insert(row).select().single()
        : await client.from('master_cans').update(row).eq('id', match.id).select().single()

    if (!result.error && result.data) {
      return normalizeMasterCan(result.data as MasterCan)
    }

    if (result.error && shouldRetryMasterCanWithoutExtendedColumns(result.error) && attempt === 0) {
      if (import.meta.env.DEV) {
        console.warn('[master_cans] Retrying without extended columns', result.error)
      }
      row = stripExtendedMasterColumns(row)
      continue
    }

    throw new Error(formatMasterCanError(result.error, 'Failed to save master can'))
  }

  throw new Error('Failed to save master can')
}

interface UpsertCloudMasterResult {
  master: MasterCan
  updatedExisting: boolean
}

async function resolveDuplicateMasterCan(
  master: ApproveSuggestionInput,
  sourceUrl: string | null,
  err?: unknown,
): Promise<MasterCan | null> {
  const existing = await findExistingCloudMasterCan(master, sourceUrl)
  if (existing) return existing

  if (isBarcodeDuplicateError(err)) {
    const barcode = normalizeMasterBarcode(master.barcode)
    if (barcode) {
      return findCloudMasterByBarcode(barcode)
    }
  }

  return null
}

async function upsertCloudMasterCan(
  master: ApproveSuggestionInput,
  suggestion?: PendingCanSuggestion,
  adminApproved = true,
): Promise<UpsertCloudMasterResult> {
  const rawSourceUrl =
    master.source_url ?? suggestion?.source_url ?? suggestion?.product_page_url ?? null
  const sourceUrl = resolveMasterSourceUrl(rawSourceUrl, master.source ?? suggestion?.source)
  const payload = buildMasterCanPayload(master, sourceUrl, adminApproved)

  let existing = await findExistingCloudMasterCan(master, sourceUrl)

  if (existing) {
    const updated = await writeCloudMasterCan(payload, { type: 'id', id: existing.id })
    return { master: updated, updatedExisting: true }
  }

  try {
    const inserted = await writeCloudMasterCan(payload, { type: 'insert' })
    return { master: inserted, updatedExisting: false }
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err

    existing = await resolveDuplicateMasterCan(master, sourceUrl, err)

    if (!existing) {
      const insertPayload = sanitizeMasterCanWritePayload({ ...payload })
      delete insertPayload.source_url
      try {
        const inserted = await writeCloudMasterCan(insertPayload, { type: 'insert' })
        return { master: inserted, updatedExisting: false }
      } catch (retryErr) {
        if (!isDuplicateKeyError(retryErr)) throw retryErr
        existing = await resolveDuplicateMasterCan(master, sourceUrl, retryErr)
      }
    }

    if (!existing) throw err

    const updated = await writeCloudMasterCan(payload, { type: 'id', id: existing.id })
    return { master: updated, updatedExisting: true }
  }
}

export interface ApproveSuggestionResult {
  master: MasterCan
  linkedCans: number
  updatedExisting: boolean
}

export interface ApproveAllBatchResult {
  approved: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}

export function buildApproveInputFromSuggestion(
  suggestion: PendingCanSuggestion,
  overrides?: Partial<ApproveSuggestionInput>,
): ApproveSuggestionInput {
  const isOfficial = suggestion.source === 'official_site'
  return {
    brand: suggestion.brand ?? (isOfficial ? 'Monster Energy' : 'Monster'),
    product_name: suggestion.product_name ?? '',
    flavor: suggestion.flavor ?? '',
    variant_name: suggestion.variant_name ?? suggestion.flavor ?? '',
    volume: suggestion.volume ?? '',
    country: suggestion.country ?? (isOfficial ? 'US' : ''),
    category: suggestion.category ?? '',
    barcode: normalizeMasterBarcode(suggestion.barcode) ?? undefined,
    reference_image_url: suggestion.image_url,
    image_url: suggestion.image_url,
    image_source: isOfficial ? 'official_site' : suggestion.source === 'open_food_facts' ? 'open_food_facts' : 'manual',
    source: suggestion.source,
    source_url: suggestion.source_url ?? suggestion.product_page_url ?? '',
    rarity: 'unknown',
    release_year: null,
    discontinued: false,
    ...overrides,
  }
}

export async function approveAllOfficialPending(): Promise<ApproveAllBatchResult> {
  const pending = await fetchPendingSuggestions('pending')
  const official = pending.filter((row) => row.source === 'official_site')

  const result: ApproveAllBatchResult = {
    approved: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  for (const suggestion of official) {
    const name = suggestion.product_name?.trim()
    const brand = suggestion.brand?.trim()
    if (!name || !brand) {
      result.skipped++
      continue
    }

    try {
      const input = buildApproveInputFromSuggestion(suggestion)
      const approval = await approvePendingSuggestion(suggestion, input)
      if (approval.updatedExisting) result.updated++
      else result.approved++
    } catch (err) {
      result.failed++
      const label = suggestion.product_name ?? suggestion.id
      result.errors.push(`${label}: ${formatMasterCanError(err, 'Approve failed')}`)
    }
  }

  return result
}

export async function approvePendingSuggestion(
  suggestion: PendingCanSuggestion,
  master: ApproveSuggestionInput,
): Promise<ApproveSuggestionResult> {
  let approvedMaster: MasterCan
  const barcode = normalizeMasterBarcode(master.barcode) ?? ''

  let updatedExisting = false

  if (useLocalPendingStore()) {
    const referenceFields = toMasterCanReferenceFields(
      buildMasterReferencePayload({
        reference_image_url: master.reference_image_url ?? suggestion.image_url,
        image_url: master.image_url,
        image_source: master.image_source,
        source: master.source ?? suggestion.source,
        adminApproved: true,
      }),
    )

    const sourceUrl = resolveMasterSourceUrl(
      master.source_url ?? suggestion.source_url ?? suggestion.product_page_url,
      master.source ?? suggestion.source,
    )

    const beforeId = findLocalExistingMaster({
      barcode: barcode || null,
      sourceUrl,
      brand: master.brand,
      product_name: master.product_name,
      flavor: master.flavor,
      category: master.category,
    })?.id

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
      barcode_source: barcode ? 'user_scan' : null,
      ...referenceFields,
      source: normalizeMasterSource(master.source ?? suggestion.source),
      source_url: sourceUrl,
      rarity: master.rarity ?? 'unknown',
      release_year: master.release_year ?? null,
      discontinued: master.discontinued ?? false,
      active: true,
      collection_set: null,
      base_product_key: null,
      variant_country: null,
      variant_region: null,
      language_code: null,
      release_date: null,
      discontinued_date: null,
      catalog_date: null,
      collector_summary: null,
    })
    updatedExisting = Boolean(beforeId)
    updateLocalPendingSuggestion(suggestion.id, { status: 'approved' })
  } else {
    const result = await upsertCloudMasterCan(master, suggestion)
    approvedMaster = result.master
    updatedExisting = result.updatedExisting

    const client = requireClient()
    const { error: updateError } = await client
      .from('pending_can_suggestions')
      .update({ status: 'approved' })
      .eq('id', suggestion.id)

    if (updateError) throw updateError
  }

  const linkBarcode = (approvedMaster.barcode ?? barcode).trim()
  const linkedCans = linkBarcode
    ? await linkUserCansToMasterByBarcode(linkBarcode, approvedMaster.id)
    : 0

  return { master: approvedMaster, linkedCans, updatedExisting }
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

export async function findPossibleMasterMatchesForSuggestion(
  suggestion: PendingCanSuggestion,
): Promise<MasterCanProductMatch[]> {
  const productName = suggestion.product_name?.trim()
  if (!productName) return []

  const masters = await fetchActiveMasterCans('all')
  return findBarcodelessMasterMatches(masters, {
    product_name: productName,
    brand: suggestion.brand,
    flavor: suggestion.flavor,
    category: suggestion.category,
    variant_name: suggestion.variant_name,
  })
}

export async function attachBarcodeToMasterCan(
  masterId: string,
  barcode: string,
  barcodeSource: MasterBarcodeSource,
): Promise<MasterCan> {
  const normalized = normalizeMasterBarcode(barcode)
  if (!normalized) throw new Error('Barcode is required')

  if (useLocalPendingStore()) {
    return attachBarcodeToLocalMasterCan(masterId, normalized, barcodeSource)
  }

  const client = requireClient()
  const existing = await findCloudMasterByBarcode(normalized)
  if (existing && existing.id !== masterId) {
    throw new Error(`Barcode already linked to ${existing.product_name}`)
  }

  const { data, error } = await client
    .from('master_cans')
    .update({ barcode: normalized, barcode_source: barcodeSource })
    .eq('id', masterId)
    .select()
    .single()

  if (error) throw new Error(formatMasterCanError(error, 'Failed to attach barcode'))

  const master = normalizeMasterCan(data as MasterCan)
  await linkUserCansToMasterByBarcode(normalized, master.id)
  return master
}

export async function linkPendingSuggestionToMaster(
  suggestion: PendingCanSuggestion,
  masterId: string,
  barcodeSource: MasterBarcodeSource = 'user_scan',
): Promise<ApproveSuggestionResult> {
  const barcode = normalizeMasterBarcode(suggestion.barcode)
  if (!barcode) throw new Error('Suggestion has no barcode to link')

  const updated = await attachBarcodeToMasterCan(masterId, barcode, barcodeSource)

  if (useLocalPendingStore()) {
    updateLocalPendingSuggestion(suggestion.id, { status: 'approved' })
  } else {
    const client = requireClient()
    const { error } = await client
      .from('pending_can_suggestions')
      .update({ status: 'approved' })
      .eq('id', suggestion.id)
    if (error) throw error
  }

  const linkedCans = await linkUserCansToMasterByBarcode(barcode, updated.id)
  return { master: updated, linkedCans, updatedExisting: true }
}
