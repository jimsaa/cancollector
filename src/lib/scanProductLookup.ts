import type { CanFormData } from '../components/cans/CanForm'
import { applyScanImageToForm } from '../components/cans/CanForm'
import type { ProductLookup } from '../types/can'
import type { MasterCan } from '../types/masterCan'
import { fetchActiveMasterCans } from './masterCans'
import { findMasterByBarcode } from './masterCanMatching'
import {
  findBestBarcodelessMasterMatch,
  getMatchConfidence,
  type MatchConfidence,
} from './masterCanProductMatch'
import {
  getApprovedMasterReferenceImageUrl,
  getMasterReferenceImageUrl,
  isApprovedMasterReference,
} from './masterReferenceImage'
import { fetchProductByBarcode } from './openFoodFacts'

export type OffLookupStatus = 'found' | 'not_found' | 'error' | 'skipped'
export type MasterMatchKind = 'barcode' | 'product_name' | null

export interface BarcodeLookupResult {
  master: MasterCan | null
  matchKind: MasterMatchKind
  matchConfidence: MatchConfidence | null
  /** Medium-confidence barcode-less catalog match awaiting user confirmation */
  possibleMaster: MasterCan | null
  possibleMasterScore: number | null
  offProduct: ProductLookup | null
  offStatus: OffLookupStatus
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

/**
 * Lookup order:
 * 1) Exact master_cans barcode
 * 2) Open Food Facts
 * 3) Fuzzy OFF product name against barcode-less master_cans
 */
export async function lookupBarcodeProduct(
  barcode: string,
  emptyForm: () => CanFormData,
): Promise<BarcodeLookupResult> {
  const trimmed = barcode.trim()

  let exactMaster: MasterCan | null = null
  try {
    const masters = await fetchActiveMasterCans('all')
    exactMaster = findMasterByBarcode(masters, trimmed)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[scan] Master barcode lookup failed', err)
    }
  }

  if (isCompleteMasterMatch(exactMaster)) {
    const base = emptyForm()
    const fields = buildScanFormFields(trimmed, exactMaster, null, 'barcode')
    const form = applyScanImageToForm(
      { ...base, ...fields },
      { masterReferenceApproved: Boolean(fields.master_image_url) },
    )

    return {
      master: exactMaster,
      matchKind: 'barcode',
      matchConfidence: 'high',
      possibleMaster: null,
      possibleMasterScore: null,
      offProduct: null,
      offStatus: 'skipped',
      primarySource: 'master_database',
      form,
    }
  }

  const off = await lookupOpenFoodFacts(trimmed)
  const offProduct = off.product

  let nameMatch = null
  const offName = offProduct?.name?.trim()
  if (offName) {
    try {
      const masters = await fetchActiveMasterCans('all')
      nameMatch = findBestBarcodelessMasterMatch(masters, {
        product_name: offName,
        brand: offProduct?.brand,
        flavor: offProduct?.flavor,
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[scan] Name match lookup failed', err)
      }
    }
  }

  let master: MasterCan | null = null
  let matchKind: MasterMatchKind = null
  let matchConfidence: MatchConfidence | null = null
  let possibleMaster: MasterCan | null = null
  let possibleMasterScore: number | null = null

  if (nameMatch) {
    matchConfidence = getMatchConfidence(nameMatch.score)
    if (matchConfidence === 'high') {
      master = nameMatch.master
      matchKind = 'product_name'
    } else if (matchConfidence === 'medium') {
      possibleMaster = nameMatch.master
      possibleMasterScore = nameMatch.score
    }
  }

  const primarySource: BarcodeLookupResult['primarySource'] = master
    ? 'master_database'
    : offProduct
      ? 'open_food_facts'
      : 'none'

  const base = emptyForm()
  const fields = buildScanFormFields(trimmed, master, offProduct, matchKind)
  const form = applyScanImageToForm(
    { ...base, ...fields },
    { masterReferenceApproved: Boolean(matchKind && fields.master_image_url) },
  )

  if (import.meta.env.DEV) {
    console.info('[scan] Barcode lookup', {
      barcode: trimmed,
      exactBarcode: Boolean(exactMaster),
      nameMatch: nameMatch?.master.product_name ?? null,
      matchKind,
      matchConfidence,
      offStatus: off.status,
      name: form.name || null,
      hasMasterImage: Boolean(form.master_image_url),
    })
  }

  return {
    master,
    matchKind,
    matchConfidence,
    possibleMaster,
    possibleMasterScore,
    offProduct,
    offStatus: off.status,
    primarySource,
    form,
  }
}
