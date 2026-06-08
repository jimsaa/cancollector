import type { MasterCan } from '../types/masterCan'

export function inferBaseProductKey(master: MasterCan): string {
  const explicit = master.base_product_key?.trim()
  if (explicit) return explicit.toLowerCase()

  let name = master.product_name.trim().toLowerCase()
  name = name.replace(/\s+(us|uk|se|de|ca|au|eu|sweden|germany|canada)\b/gi, '')
  name = name.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return name || master.id
}

export function getVariantCountryLabel(master: MasterCan): string | null {
  return (
    master.variant_country?.trim() ||
    master.country?.trim() ||
    master.variant_region?.trim() ||
    null
  )
}

export function groupCountryVariants(masters: MasterCan[]): Map<string, MasterCan[]> {
  const groups = new Map<string, MasterCan[]>()

  for (const master of masters) {
    const key = inferBaseProductKey(master)
    const list = groups.get(key) ?? []
    list.push(master)
    groups.set(key, list)
  }

  for (const list of groups.values()) {
    list.sort((a, b) =>
      (getVariantCountryLabel(a) ?? '').localeCompare(getVariantCountryLabel(b) ?? ''),
    )
  }

  return groups
}

export function findCountryVariants(master: MasterCan, catalog: MasterCan[]): MasterCan[] {
  const key = inferBaseProductKey(master)
  return catalog
    .filter((row) => row.id !== master.id && inferBaseProductKey(row) === key)
    .sort((a, b) =>
      (getVariantCountryLabel(a) ?? '').localeCompare(getVariantCountryLabel(b) ?? ''),
    )
}
