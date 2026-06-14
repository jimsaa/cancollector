import type { MasterCan } from '../types/masterCan'
import { normalizeMasterBarcode } from './masterCanSupabase'
import { normalizeMasterCan } from './masterCanNormalize'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'
import { upsertLocalApprovedMasterCan } from './localMasterCans'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

export interface CorrectMasterIdentifiersInput {
  barcode?: string | null
  sku?: string | null
  external_product_id?: string | null
  adminUserId: string
}

export async function correctMasterIdentifiers(
  master: MasterCan,
  input: CorrectMasterIdentifiersInput,
): Promise<MasterCan> {
  const barcode = input.barcode !== undefined ? normalizeMasterBarcode(input.barcode) : master.barcode
  const sku = input.sku !== undefined ? input.sku?.trim().toUpperCase() || null : master.sku
  const external_product_id =
    input.external_product_id !== undefined
      ? input.external_product_id?.trim() || null
      : master.external_product_id
  const corrected_at = new Date().toISOString()

  const patch = {
    ...master,
    barcode,
    barcode_source: barcode ? 'admin_manual' : master.barcode_source,
    sku,
    external_product_id,
    corrected_by: input.adminUserId,
    corrected_at,
  }

  if (!isConfigured || useGuestStorage()) {
    return upsertLocalApprovedMasterCan(patch)
  }

  const client = requireClient()
  const { data, error } = await client
    .from('master_cans')
    .update({
      barcode,
      barcode_source: barcode ? 'admin_manual' : master.barcode_source,
      sku,
      external_product_id,
      corrected_by: input.adminUserId,
      corrected_at,
    })
    .eq('id', master.id)
    .select()
    .single()

  if (error) throw error
  return normalizeMasterCan(data as MasterCan)
}
