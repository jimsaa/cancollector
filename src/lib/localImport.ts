import type { Can, CanInsert, Rarity, WishlistStatus } from '../types/can'
import type { ImageSource } from '../types/imageSource'
import { createCan, fetchCans, updateCan } from './cans'
import { findDuplicateCan, normalizeKey } from './duplicates'
import { discoverGuestCans } from './localCanDiscovery'
import { getAllLocalCans } from './localCans'
import { normalizeCanTradeFields } from './tradeFields'
import { formatSupabaseError, logAuthError } from './supabaseDebug'

const IMPORT_STATUS_KEY = 'cancollector-import-status'

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'unknown']
const WISHLIST_STATUSES: WishlistStatus[] = ['wanted', 'missing']
const IMAGE_SOURCES: ImageSource[] = ['user', 'master_database', 'open_food_facts', 'placeholder']

export type ImportStatus = 'pending' | 'completed' | 'skipped'

export interface LocalImportResult {
  total: number
  imported: number
  merged: number
  skipped: number
  failed: number
  errors: string[]
}

function importStatusKey(userId: string): string {
  return `${IMPORT_STATUS_KEY}-${userId}`
}

export function getImportStatus(userId: string): ImportStatus | null {
  try {
    const raw = localStorage.getItem(importStatusKey(userId))
    if (raw === 'completed' || raw === 'skipped') return raw
    return null
  } catch {
    return null
  }
}

export function setImportStatus(userId: string, status: ImportStatus): void {
  try {
    localStorage.setItem(importStatusKey(userId), status)
  } catch {
    // ignore
  }
}

/** Clear dismissed/completed state so the import prompt can show again. */
export function resetImportPrompt(userId: string): void {
  try {
    localStorage.removeItem(importStatusKey(userId))
  } catch {
    // ignore
  }
}

export interface LocalImportCheckResult {
  userId: string
  keysFound: string[]
  canCount: number
  importStatus: ImportStatus | null
  shouldPrompt: boolean
}

export function checkLocalImportState(userId: string): LocalImportCheckResult {
  const discovery = discoverGuestCans()
  const importStatus = getImportStatus(userId)
  const canCount = discovery.cans.length
  const shouldPrompt =
    canCount > 0 && importStatus !== 'completed' && importStatus !== 'skipped'

  return {
    userId,
    keysFound: discovery.keysFound,
    canCount,
    importStatus,
    shouldPrompt,
  }
}

export function logLocalImportCheck(check: LocalImportCheckResult): void {
  console.info('[LOCAL_IMPORT_CHECK]', {
    userId: check.userId,
    keysFound: check.keysFound,
    canCount: check.canCount,
    importStatus: check.importStatus,
    shouldPrompt: check.shouldPrompt,
  })
}

export function shouldPromptLocalImport(userId: string): boolean {
  return checkLocalImportState(userId).shouldPrompt
}

function findWishlistDuplicate(
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
        c.is_wishlist &&
        c.barcode?.trim() === code &&
        normalizeKey(c.country) === countryKey &&
        normalizeKey(c.country_variant) === variantKey,
    ) ?? null
  )
}

function sanitizeImageUrl(
  url: string | null | undefined,
  fieldLabel: string,
  warnings: string[],
): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('data:')) {
    warnings.push(`${fieldLabel}: base64 image skipped`)
    console.warn(`[IMPORT_LOCAL_CANS_ERROR] ${fieldLabel}: base64 image not stored in cloud`)
    return null
  }
  if (trimmed.length > 2048) {
    warnings.push(`${fieldLabel}: image URL too long, skipped`)
    return null
  }
  return trimmed
}

function coerceRarity(value: unknown): Rarity {
  return RARITIES.includes(value as Rarity) ? (value as Rarity) : 'unknown'
}

function coerceWishlistStatus(value: unknown): WishlistStatus | null {
  if (value === null || value === undefined) return null
  return WISHLIST_STATUSES.includes(value as WishlistStatus) ? (value as WishlistStatus) : null
}

function coerceImageSource(value: unknown): ImageSource {
  return IMAGE_SOURCES.includes(value as ImageSource) ? (value as ImageSource) : 'placeholder'
}

/** Validate a local can before cloud import. Returns error message or null if OK. */
export function validateLocalCan(can: Can): string | null {
  if (!can.name?.trim() && !can.barcode?.trim()) {
    return 'Can must have a name or barcode'
  }
  const qty = Number(can.quantity)
  if (!Number.isFinite(qty) || qty < 1) {
    return 'Invalid quantity'
  }
  return null
}

/**
 * Map localStorage can to Supabase insert shape.
 * Strips unknown fields, sanitizes images, ensures user_id on insert path.
 */
export function mapLocalCanToCloudInsert(
  local: Can,
  userId: string,
  warnings: string[],
): CanInsert {
  const imageUrl = sanitizeImageUrl(local.image_url, 'image_url', warnings)
  const userImageUrl = sanitizeImageUrl(local.user_image_url, 'user_image_url', warnings)
  const masterImageUrl = sanitizeImageUrl(local.master_image_url, 'master_image_url', warnings)
  const offImageUrl = sanitizeImageUrl(local.off_image_url, 'off_image_url', warnings)

  let imageSource = coerceImageSource(local.image_source)
  if (!imageUrl && !userImageUrl && imageSource === 'user') {
    imageSource = 'placeholder'
  }

  const row: CanInsert = {
    user_id: userId,
    barcode: local.barcode?.trim() || null,
    name: local.name?.trim() || null,
    brand: local.brand?.trim() || null,
    flavor: local.flavor?.trim() || null,
    volume: local.volume?.trim() || null,
    country: local.country?.trim() || null,
    country_variant: local.country_variant?.trim() || null,
    image_url: imageUrl ?? userImageUrl ?? masterImageUrl ?? offImageUrl,
    image_source: imageSource,
    user_image_url: userImageUrl,
    master_image_url: masterImageUrl,
    off_image_url: offImageUrl,
    opening_status: local.opening_status,
    opened: Boolean(local.opened),
    purchase_date: local.purchase_date || null,
    purchase_country: local.purchase_country?.trim() || null,
    purchase_city: local.purchase_city?.trim() || null,
    purchase_store: local.purchase_store?.trim() || null,
    added_date: local.added_date || new Date().toISOString(),
    trade_status: local.trade_status,
    available_for_trade: Boolean(local.available_for_trade),
    trade_price: local.trade_price != null ? Number(local.trade_price) : null,
    trade_currency: local.trade_currency || null,
    trade_note: local.trade_note?.trim() || null,
    is_public: Boolean(local.is_public),
    show_on_public_profile: Boolean(local.show_on_public_profile),
    condition_grade: local.condition_grade,
    condition_notes: local.condition_notes?.trim() || null,
    notes: local.notes?.trim() || null,
    rarity: coerceRarity(local.rarity),
    quantity: Math.max(1, Math.floor(Number(local.quantity) || 1)),
    is_wishlist: Boolean(local.is_wishlist),
    wishlist_status: local.is_wishlist ? coerceWishlistStatus(local.wishlist_status) : null,
    wanted: Boolean(local.wanted),
    master_can_id: local.master_can_id || null,
  }

  return normalizeCanTradeFields(row)
}

function isSchemaColumnError(err: unknown): boolean {
  const msg = formatSupabaseError(err).toLowerCase()
  const code = (err as { code?: string })?.code
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    msg.includes('column') ||
    msg.includes('schema cache')
  )
}

/** Core columns from base migration — retry insert without optional extended fields. */
function toCoreCanInsert(full: CanInsert): CanInsert {
  return {
    barcode: full.barcode,
    name: full.name,
    brand: full.brand,
    flavor: full.flavor,
    volume: full.volume,
    country: full.country,
    country_variant: full.country_variant,
    image_url: full.image_url,
    image_source: 'placeholder',
    user_image_url: null,
    master_image_url: null,
    off_image_url: null,
    opening_status: full.opening_status ?? 'sealed',
    opened: full.opened,
    purchase_date: full.purchase_date,
    purchase_country: full.purchase_country ?? null,
    purchase_city: full.purchase_city ?? null,
    purchase_store: full.purchase_store ?? null,
    added_date: full.added_date,
    trade_status: full.trade_status ?? 'not_for_trade',
    available_for_trade: full.available_for_trade,
    trade_price: full.trade_price ?? null,
    trade_currency: full.trade_currency ?? null,
    trade_note: full.trade_note ?? null,
    is_public: full.is_public ?? false,
    show_on_public_profile: full.show_on_public_profile ?? false,
    condition_grade: full.condition_grade ?? 'unknown',
    condition_notes: full.condition_notes ?? null,
    wanted: full.wanted ?? false,
    notes: full.notes,
    rarity: full.rarity,
    quantity: full.quantity,
    is_wishlist: full.is_wishlist,
    wishlist_status: full.wishlist_status,
  }
}

async function insertLocalCanToCloud(userId: string, payload: CanInsert): Promise<Can> {
  try {
    return await createCan(userId, payload, { skipTradeSync: true, maxActiveListings: 999 })
  } catch (err) {
    if (!isSchemaColumnError(err)) throw err
    logAuthError('IMPORT_LOCAL_CANS_ERROR', { phase: 'retry_core_fields', error: err })
    return await createCan(userId, toCoreCanInsert(payload), {
      skipTradeSync: true,
      maxActiveListings: 999,
    })
  }
}

export async function importLocalCollectionToCloud(userId: string): Promise<LocalImportResult> {
  const localCans = getAllLocalCans()
  const result: LocalImportResult = {
    total: localCans.length,
    imported: 0,
    merged: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  if (localCans.length === 0) {
    return result
  }

  let cloudCans: Can[]
  try {
    cloudCans = await fetchCans(userId)
  } catch (err) {
    logAuthError('IMPORT_LOCAL_CANS_ERROR', err)
    const message = formatSupabaseError(err, 'Could not load cloud collection')
    result.errors.push(message)
    throw new Error(message)
  }

  for (const local of localCans) {
    const validationError = validateLocalCan(local)
    if (validationError) {
      result.failed++
      const label = local.name || local.barcode || local.id
      result.errors.push(`${label}: ${validationError}`)
      logAuthError('IMPORT_LOCAL_CANS_ERROR', { canId: local.id, validationError })
      continue
    }

    const warnings: string[] = []
    const barcode = local.barcode?.trim() ?? ''

    try {
      if (local.is_wishlist && barcode) {
        const wishDup = findWishlistDuplicate(
          cloudCans,
          barcode,
          local.country,
          local.country_variant,
        )
        if (wishDup) {
          result.skipped++
          continue
        }
      } else if (barcode) {
        const dup = findDuplicateCan(cloudCans, barcode, local.country, local.country_variant)
        if (dup) {
          try {
            const updated = await updateCan(
              dup.id,
              { quantity: dup.quantity + Math.max(1, local.quantity) },
              { skipTradeSync: true },
            )
            result.merged++
            cloudCans = cloudCans.map((c) => (c.id === dup.id ? updated : c))
          } catch (mergeErr) {
            result.failed++
            const msg = formatSupabaseError(mergeErr, 'Merge failed')
            result.errors.push(`${local.name ?? barcode}: ${msg}`)
            logAuthError('IMPORT_LOCAL_CANS_ERROR', { canId: local.id, mergeErr })
          }
          continue
        }
      }

      const payload = mapLocalCanToCloudInsert(local, userId, warnings)
      if (warnings.length > 0) {
        console.warn('[IMPORT_LOCAL_CANS_ERROR] warnings for can', local.id, warnings)
      }

      const created = await insertLocalCanToCloud(userId, payload)
      result.imported++
      cloudCans = [created, ...cloudCans]
    } catch (err) {
      result.failed++
      const msg = formatSupabaseError(err, 'Import failed')
      const label = local.name ?? local.barcode ?? local.id
      result.errors.push(`${label}: ${msg}`)
      logAuthError('IMPORT_LOCAL_CANS_ERROR', { canId: local.id, err })
    }
  }

  if (result.failed === 0 && (result.imported > 0 || result.merged > 0)) {
    setImportStatus(userId, 'completed')
  }

  return result
}
