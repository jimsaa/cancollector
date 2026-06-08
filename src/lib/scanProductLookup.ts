import type { CanFormData } from '../components/cans/CanForm'
import { applyScanImageToForm } from '../components/cans/CanForm'
import type { ProductLookup } from '../types/can'
import type { MasterCan } from '../types/masterCan'
import { fetchActiveMasterCans } from './masterCans'
import { findMasterByBarcode } from './masterCanMatching'
import {
  getApprovedMasterReferenceImageUrl,
  isApprovedMasterReference,
} from './masterReferenceImage'
import { fetchProductByBarcode } from './openFoodFacts'

export type OffLookupStatus = 'found' | 'not_found' | 'error' | 'skipped'

export interface BarcodeLookupResult {
  master: MasterCan | null
  offProduct: ProductLookup | null
  offStatus: OffLookupStatus
  /** Primary data source used for product fields */
  primarySource: 'master_database' | 'open_food_facts' | 'none'
  form: CanFormData
}

function pickField(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

/** Master match counts only when it has a real product name (empty stubs still use OFF). */
export function isCompleteMasterMatch(master: MasterCan | null): master is MasterCan {
  return Boolean(master?.product_name?.trim())
}

export function buildScanFormFields(
  barcode: string,
  master: MasterCan | null,
  offProduct: ProductLookup | null,
): Pick<
  CanFormData,
  | 'barcode'
  | 'name'
  | 'brand'
  | 'flavor'
  | 'volume'
  | 'country'
  | 'country_variant'
  | 'off_image_url'
  | 'master_image_url'
  | 'rarity'
> {
  const masterImage =
    master && isApprovedMasterReference(master)
      ? getApprovedMasterReferenceImageUrl(master) ?? ''
      : ''

  return {
    barcode,
    name: pickField(master?.product_name, offProduct?.name),
    brand: pickField(master?.brand, offProduct?.brand) || 'Monster',
    flavor: pickField(master?.flavor, offProduct?.flavor),
    volume: pickField(master?.volume, offProduct?.volume),
    country: pickField(master?.country, offProduct?.country),
    country_variant: pickField(master?.variant_name),
    off_image_url: pickField(offProduct?.image_url),
    master_image_url: pickField(masterImage),
    rarity: master?.rarity ?? 'unknown',
  }
}

async function lookupMasterCan(barcode: string): Promise<MasterCan | null> {
  try {
    const masters = await fetchActiveMasterCans('all')
    return findMasterByBarcode(masters, barcode)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[scan] Master database lookup failed — continuing with Open Food Facts', err)
    }
    return null
  }
}

async function lookupOpenFoodFacts(barcode: string): Promise<{
  product: ProductLookup | null
  status: OffLookupStatus
}> {
  try {
    const product = await fetchProductByBarcode(barcode)
    return { product, status: product ? 'found' : 'not_found' }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[scan] Open Food Facts lookup failed', { barcode, err })
    }
    return { product: null, status: 'error' }
  }
}

/**
 * Match barcode against master_cans first, but always query Open Food Facts unless master
 * has a complete product name. Master lookup failures never block OFF.
 */
export async function lookupBarcodeProduct(
  barcode: string,
  emptyForm: () => CanFormData,
): Promise<BarcodeLookupResult> {
  const trimmed = barcode.trim()

  const [rawMaster, off] = await Promise.all([
    lookupMasterCan(trimmed),
    lookupOpenFoodFacts(trimmed),
  ])

  const master = isCompleteMasterMatch(rawMaster) ? rawMaster : null
  const offProduct = off.product
  const offStatus: OffLookupStatus = master ? 'skipped' : off.status

  const primarySource: BarcodeLookupResult['primarySource'] = master
    ? 'master_database'
    : offProduct
      ? 'open_food_facts'
      : 'none'

  const base = emptyForm()
  const fields = buildScanFormFields(trimmed, rawMaster, offProduct)
  const form = applyScanImageToForm({ ...base, ...fields })

  if (import.meta.env.DEV) {
    console.info('[scan] Barcode lookup', {
      barcode: trimmed,
      masterMatch: Boolean(rawMaster),
      masterComplete: Boolean(master),
      offStatus,
      name: form.name || null,
      hasOffImage: Boolean(form.off_image_url),
      hasMasterImage: Boolean(form.master_image_url),
    })
  }

  return { master, offProduct, offStatus, primarySource, form }
}
