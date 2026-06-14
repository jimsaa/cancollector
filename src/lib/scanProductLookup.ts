import type { CanFormData } from '../components/cans/CanForm'
import { applyScanImageToForm } from '../components/cans/CanForm'
import type { ProductLookup } from '../types/can'
import type { MasterCan } from '../types/masterCan'
import { fetchMasterCans } from './masterCans'
import {
  findMasterByBarcode,
  findMasterByProductId,
  findMasterBySku,
} from './masterCanMatching'
import {
  findBarcodelessMasterMatches,
  findBestBarcodelessMasterMatchFromOff,
  type MasterCanProductMatch,
} from './masterCanProductMatch'
import {
  getApprovedMasterReferenceImageUrl,
  getMasterReferenceImageUrl,
  isApprovedMasterReference,
} from './masterReferenceImage'
import { fetchProductByBarcode } from './openFoodFacts'

export type OffLookupStatus = 'found' | 'not_found' | 'error' | 'skipped'
export type MasterMatchKind = 'barcode' | 'sku' | 'product_id' | 'product_name' | null

export interface BarcodeLookupResult {
  master: MasterCan | null
  matchKind: MasterMatchKind
  /** User-selected name match only — never auto-assigned */
  possibleMatches: MasterCanProductMatch[]
  offProduct: ProductLookup | null
  offStatus: OffLookupStatus
  primarySource: 'master_database' | 'open_food_facts' | 'none'
  masterCatalogTotal: number
  form: CanFormData
}

function pickField(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

export function isCompleteMasterMatch(master: MasterCan | null): master is MasterCan {
  return Boolean(master?.product_name?.trim())
}

function getMasterImageForScan(master: MasterCan, matchKind: MasterMatchKind): string {
  const approved = getApprovedMasterReferenceImageUrl(master)
  if (approved) return approved
  if (matchKind === 'product_name') {
    return getMasterReferenceImageUrl(master) ?? ''
  }
  if (isApprovedMasterReference(master)) {
    return getApprovedMasterReferenceImageUrl(master) ?? ''
  }
  return ''
}

export function buildScanFormFields(
  barcode: string,
  master: MasterCan | null,
  offProduct: ProductLookup | null,
  matchKind: MasterMatchKind = null,
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
  const useMaster = Boolean(master && matchKind)
  const masterImage = master ? getMasterImageForScan(master, matchKind) : ''

  return {
    barcode,
    name: useMaster ? pickField(master?.product_name, offProduct?.name) : pickField(offProduct?.name, master?.product_name),
    brand: useMaster ? pickField(master?.brand, offProduct?.brand) || 'Monster' : pickField(offProduct?.brand, master?.brand) || 'Monster',
    flavor: useMaster ? pickField(master?.flavor, offProduct?.flavor) : pickField(offProduct?.flavor, master?.flavor),
    volume: useMaster ? pickField(master?.volume, offProduct?.volume) : pickField(offProduct?.volume, master?.volume),
    country: useMaster ? pickField(master?.country, offProduct?.country) : pickField(offProduct?.country, master?.country),
    country_variant: useMaster ? pickField(master?.variant_name) : pickField(master?.variant_name),
    off_image_url: pickField(offProduct?.image_url),
    master_image_url: pickField(masterImage),
    rarity: master?.rarity ?? 'unknown',
  }
}

export function applyNameMatchedMasterToForm(
  form: CanFormData,
  master: MasterCan,
): CanFormData {
  const fields = buildScanFormFields(form.barcode, master, null, 'product_name')
  const masterImage = fields.master_image_url
  return applyScanImageToForm(
    {
      ...form,
      ...fields,
    },
    { masterReferenceApproved: Boolean(masterImage) },
  )
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

function buildExactMasterResult(
  trimmed: string,
  master: MasterCan,
  matchKind: Exclude<MasterMatchKind, 'product_name' | null>,
  masterCatalogTotal: number,
  emptyForm: () => CanFormData,
): BarcodeLookupResult {
  const base = emptyForm()
  const fields = buildScanFormFields(trimmed, master, null, matchKind)
  const form = applyScanImageToForm(
    { ...base, ...fields },
    { masterReferenceApproved: Boolean(fields.master_image_url) },
  )

  return {
    master,
    matchKind,
    possibleMatches: [],
    offProduct: null,
    offStatus: 'skipped',
    primarySource: 'master_database',
    masterCatalogTotal,
    form,
  }
}

function collectPossibleMatches(
  masters: MasterCan[],
  offProduct: ProductLookup | null,
  scannedBarcode: string,
): MasterCanProductMatch[] {
  if (offProduct?.name?.trim()) {
    const best = findBestBarcodelessMasterMatchFromOff(masters, offProduct, scannedBarcode)
    const fromOff = findBarcodelessMasterMatches(
      masters,
      {
        product_name: offProduct.name,
        brand: offProduct.brand,
        flavor: offProduct.flavor,
      },
      { limit: 5, scannedBarcode },
    )
    if (best && !fromOff.some((m) => m.master.id === best.master.id)) {
      return [best, ...fromOff].slice(0, 5)
    }
    return fromOff
  }

  return []
}

/**
 * Exact master identification only (barcode, SKU, product ID).
 * Name-based matches are suggestions — never auto-selected.
 *
 * Lookup order:
 * 1) Exact master_cans barcode
 * 2) Exact master_cans SKU
 * 3) Exact master_cans external_product_id
 * 4) Open Food Facts (identification only)
 * 5) Possible name matches shown for manual selection
 */
export async function lookupBarcodeProduct(
  barcode: string,
  emptyForm: () => CanFormData,
): Promise<BarcodeLookupResult> {
  const trimmed = barcode.trim()

  let masters: MasterCan[] = []
  try {
    masters = await fetchMasterCans('all')
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[scan] Master database fetch failed', err)
    }
  }

  const activeMasters = masters.filter((m) => m.active !== false)
  const masterCatalogTotal = activeMasters.length

  const exactBarcode = masters.length > 0 ? findMasterByBarcode(masters, trimmed) : null
  if (isCompleteMasterMatch(exactBarcode)) {
    return buildExactMasterResult(trimmed, exactBarcode, 'barcode', masterCatalogTotal, emptyForm)
  }

  const exactSku = masters.length > 0 ? findMasterBySku(masters, trimmed) : null
  if (isCompleteMasterMatch(exactSku)) {
    return buildExactMasterResult(trimmed, exactSku, 'sku', masterCatalogTotal, emptyForm)
  }

  const exactProductId = masters.length > 0 ? findMasterByProductId(masters, trimmed) : null
  if (isCompleteMasterMatch(exactProductId)) {
    return buildExactMasterResult(trimmed, exactProductId, 'product_id', masterCatalogTotal, emptyForm)
  }

  const off = await lookupOpenFoodFacts(trimmed)
  const offProduct = off.product
  const possibleMatches = collectPossibleMatches(masters, offProduct, trimmed)

  const primarySource: BarcodeLookupResult['primarySource'] = offProduct
    ? 'open_food_facts'
    : 'none'

  const base = emptyForm()
  const fields = buildScanFormFields(trimmed, null, offProduct, null)
  const form = applyScanImageToForm(
    { ...base, ...fields },
    { masterReferenceApproved: false },
  )

  if (import.meta.env.DEV) {
    console.info('[scan] Barcode lookup', {
      barcode: trimmed,
      catalogCount: masters.length,
      exactBarcode: Boolean(exactBarcode),
      exactSku: Boolean(exactSku),
      exactProductId: Boolean(exactProductId),
      possibleMatchCount: possibleMatches.length,
      offStatus: off.status,
      offName: offProduct?.name ?? null,
    })
  }

  return {
    master: null,
    matchKind: null,
    possibleMatches,
    offProduct,
    offStatus: off.status,
    primarySource,
    masterCatalogTotal,
    form,
  }
}
