import type { MasterCan } from '../types/masterCan'
import { normalizeMasterReferenceFields } from './masterReferenceImage'

type RawMasterCan = Partial<MasterCan> & {
  region?: string | null
  reference_image_approved?: boolean | null
}

/** Normalize DB/seed rows — maps legacy `region` to `country`. */
export function normalizeMasterCan(raw: RawMasterCan): MasterCan {
  return normalizeMasterReferenceFields({
    id: raw.id!,
    brand: raw.brand!,
    product_name: raw.product_name!,
    flavor: raw.flavor ?? null,
    variant_name: raw.variant_name ?? null,
    volume: raw.volume ?? null,
    barcode: raw.barcode ?? null,
    country: raw.country ?? raw.region ?? null,
    image_url: raw.image_url ?? null,
    reference_image_url: raw.reference_image_url ?? raw.image_url ?? null,
    image_source: raw.image_source ?? null,
    reference_image_status: raw.reference_image_status ?? 'placeholder',
    off_preview_image_url: raw.off_preview_image_url ?? null,
    reference_image_approved: raw.reference_image_approved ?? undefined,
    source: raw.source ?? null,
    source_url: raw.source_url ?? null,
    category: raw.category ?? null,
    rarity: raw.rarity ?? 'unknown',
    release_year: raw.release_year ?? null,
    discontinued: raw.discontinued ?? false,
    active: raw.active ?? true,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }) as MasterCan
}

export function mergeMasterCans(primary: MasterCan[], extras: MasterCan[]): MasterCan[] {
  const byBarcode = new Map<string, MasterCan>()
  const byId = new Map<string, MasterCan>()

  for (const can of primary) {
    byId.set(can.id, can)
    if (can.barcode) byBarcode.set(can.barcode.trim(), can)
  }

  for (const can of extras) {
    if (can.barcode && byBarcode.has(can.barcode.trim())) continue
    if (byId.has(can.id)) continue
    byId.set(can.id, can)
    if (can.barcode) byBarcode.set(can.barcode.trim(), can)
  }

  return [...byId.values()].sort((a, b) => a.product_name.localeCompare(b.product_name))
}
