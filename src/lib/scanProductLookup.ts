import type { CanFormData } from '../components/cans/CanForm'
import { applyAutoImageToForm } from '../components/cans/CanForm'
import type { ProductLookup } from '../types/can'
import type { MasterCan } from '../types/masterCan'
import { fetchActiveMasterCans } from './masterCans'
import { findMasterByBarcode } from './masterCanMatching'
import { getMasterReferenceImageUrl } from './masterReferenceImage'
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
  const masterImage = master ? getMasterReferenceImageUrl(master) : ''
  return {
    barcode,
    name: master?.product_name ?? offProduct?.name ?? '',
    brand: master?.brand ?? offProduct?.brand ?? 'Monster',
    flavor: master?.flavor ?? offProduct?.flavor ?? '',
    volume: master?.volume ?? offProduct?.volume ?? '',
    country: master?.country ?? offProduct?.country ?? '',
    country_variant: master?.variant_name ?? '',
    off_image_url: offProduct?.image_url ?? '',
    master_image_url: masterImage ?? '',
    rarity: master?.rarity ?? 'unknown',
  }
}

/**
 * Match barcode against master_cans first. Only query Open Food Facts when no master match exists.
 */
export async function lookupBarcodeProduct(
  barcode: string,
  emptyForm: () => CanFormData,
): Promise<BarcodeLookupResult> {
  const masters = await fetchActiveMasterCans('all')
  const master = findMasterByBarcode(masters, barcode)

  let offProduct: ProductLookup | null = null
  let offStatus: OffLookupStatus = 'skipped'

  if (!master) {
    try {
      offProduct = await fetchProductByBarcode(barcode)
      offStatus = offProduct ? 'found' : 'not_found'
    } catch {
      offStatus = 'error'
    }
  }

  const primarySource: BarcodeLookupResult['primarySource'] = master
    ? 'master_database'
    : offProduct
      ? 'open_food_facts'
      : 'none'

  const base = emptyForm()
  const fields = buildScanFormFields(barcode, master, offProduct)
  const form = applyAutoImageToForm({ ...base, ...fields })

  return { master, offProduct, offStatus, primarySource, form }
}
