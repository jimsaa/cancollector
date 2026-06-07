import type { Can } from '../types/can'

export function normalizeKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/** Match barcode + country + country_variant (supports regional variants). */
export function findDuplicateCan(
  cans: Can[],
  barcode: string,
  country?: string | null,
  countryVariant?: string | null,
): Can | null {
  const code = barcode.trim()
  if (!code) return null

  const countryKey = normalizeKey(country)
  const variantKey = normalizeKey(countryVariant)

  return (
    cans.find(
      (c) =>
        !c.is_wishlist &&
        c.barcode?.trim() === code &&
        normalizeKey(c.country) === countryKey &&
        normalizeKey(c.country_variant) === variantKey,
    ) ?? null
  )
}
