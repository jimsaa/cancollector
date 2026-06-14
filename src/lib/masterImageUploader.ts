import type { MasterCan } from '../types/masterCan'
import { generateId } from './id'
import { updateMasterCanReference } from './masterCanAdmin'
import { findMasterByBarcode } from './masterCanMatching'
import { normalizeMasterCan } from './masterCanNormalize'
import {
  formatMasterCanError,
  normalizeMasterBarcode,
  shouldRetryMasterCanWithoutExtendedColumns,
  stripExtendedMasterColumns,
} from './masterCanSupabase'
import { fetchActiveMasterCans } from './masterCans'
import { prepareCanImage } from './storage'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { upsertLocalApprovedMasterCan } from './localMasterCans'
import { supabase } from './supabase'

const BUCKET = 'can-images'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

export interface CreateAdminMasterInput {
  brand: string
  product_name: string
  flavor?: string | null
  barcode?: string | null
  volume?: string | null
  country?: string | null
}

export async function lookupMasterCanByBarcode(barcode: string): Promise<MasterCan | null> {
  const code = normalizeMasterBarcode(barcode)
  if (!code) return null

  if (!isConfigured || useGuestStorage()) {
    const masters = await fetchActiveMasterCans('all')
    return findMasterByBarcode(masters, code)
  }

  const client = requireClient()
  const { data, error } = await client.from('master_cans').select('*').eq('barcode', code).maybeSingle()
  if (error) throw error
  return data ? normalizeMasterCan(data as MasterCan) : null
}

export function searchMasterCansByQuery(masters: MasterCan[], query: string, limit = 12): MasterCan[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return masters
    .filter((row) => {
      const haystack = [row.product_name, row.brand, row.flavor, row.barcode, row.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    .slice(0, limit)
}

async function writeCloudMasterCan(
  payload: Record<string, unknown>,
  match: { type: 'id'; id: string } | { type: 'insert' },
): Promise<MasterCan> {
  const client = requireClient()
  let row = { ...payload }

  for (let attempt = 0; attempt < 2; attempt++) {
    const result =
      match.type === 'insert'
        ? await client.from('master_cans').insert(row).select().single()
        : await client.from('master_cans').update(row).eq('id', match.id).select().single()

    if (!result.error && result.data) {
      return normalizeMasterCan(result.data as MasterCan)
    }

    if (result.error && shouldRetryMasterCanWithoutExtendedColumns(result.error) && attempt === 0) {
      row = stripExtendedMasterColumns(row)
      continue
    }

    throw new Error(formatMasterCanError(result.error, 'Failed to save master can'))
  }

  throw new Error('Failed to save master can')
}

export async function createAdminMasterCan(input: CreateAdminMasterInput): Promise<MasterCan> {
  const brand = input.brand.trim()
  const product_name = input.product_name.trim()
  if (!brand || !product_name) throw new Error('Brand and product name are required')

  const barcode = normalizeMasterBarcode(input.barcode)
  const payload: Record<string, unknown> = {
    brand,
    product_name,
    flavor: input.flavor?.trim() || null,
    volume: input.volume?.trim() || null,
    country: input.country?.trim() || null,
    active: true,
    rarity: 'unknown',
    discontinued: false,
    reference_image_url: null,
    image_url: null,
    reference_image_status: 'placeholder',
    image_source: 'placeholder',
    ...(barcode ? { barcode, barcode_source: 'admin_manual' } : {}),
  }

  if (!isConfigured || useGuestStorage()) {
    return upsertLocalApprovedMasterCan({
      id: generateId(),
      brand,
      product_name,
      flavor: input.flavor?.trim() || null,
      variant_name: null,
      volume: input.volume?.trim() || null,
      barcode: barcode || null,
      barcode_source: barcode ? 'admin_manual' : null,
      country: input.country?.trim() || null,
      image_url: null,
      reference_image_url: null,
      reference_image_status: 'placeholder',
      off_preview_image_url: null,
      image_source: 'placeholder',
      source: null,
      source_url: null,
      category: null,
      collection_set: null,
      base_product_key: null,
      variant_country: null,
      variant_region: null,
      language_code: null,
      release_date: null,
      discontinued_date: null,
      catalog_date: null,
      collector_summary: null,
      rarity: 'unknown',
      release_year: null,
      discontinued: false,
      active: true,
      sku: null,
      external_product_id: null,
      corrected_by: null,
      corrected_at: null,
    })
  }

  if (barcode) {
    const existing = await lookupMasterCanByBarcode(barcode)
    if (existing) return existing
  }

  return writeCloudMasterCan(payload, { type: 'insert' })
}

export async function uploadMasterReferenceImageFile(
  adminUserId: string,
  masterId: string,
  source: File,
): Promise<string> {
  const prepared = await prepareCanImage(source)

  if (!isConfigured || useGuestStorage()) {
    return prepared.dataUrl
  }

  const client = requireClient()
  const path = `${adminUserId}/master-${masterId}.jpg`

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, prepared.blob, { upsert: true, contentType: prepared.mimeType })

  if (uploadError) {
    throw new Error(uploadError.message || 'Reference image upload failed')
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function saveApprovedAdminReferenceImage(
  master: MasterCan,
  referenceImageUrl: string,
): Promise<MasterCan> {
  const url = referenceImageUrl.trim()
  if (!url) throw new Error('Reference image URL is required')

  return updateMasterCanReference(master, {
    reference_image_url: url,
    reference_image_status: 'approved',
    image_source: 'admin_uploaded',
  })
}
