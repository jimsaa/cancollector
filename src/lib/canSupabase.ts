import type { CanInsert, CanUpdate } from '../types/can'
import { normalizeCanTradeFields } from './tradeFields'

/** Columns added in later migrations — omitted on fallback insert if DB is behind. */
const EXTENDED_CAN_COLUMNS = [
  'image_source',
  'user_image_url',
  'master_image_url',
  'off_image_url',
  'wanted',
  'master_can_id',
] as const

function nullIfEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed || null
}

function isMissingColumnError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const record = err as { code?: string; message?: string }
  if (record.code === 'PGRST204') return true
  const msg = (record.message ?? '').toLowerCase()
  return msg.includes('column') && (msg.includes('does not exist') || msg.includes('could not find'))
}

export function formatSaveCanError(err: unknown, fallback = 'Failed to save can'): string {
  if (err instanceof Error && err.message) {
    const record = err as Error & { details?: string; hint?: string; code?: string }
    const parts = [
      record.message,
      record.details,
      record.hint,
      record.code ? `code: ${record.code}` : null,
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(' — ')
    return err.message
  }

  if (typeof err === 'object' && err !== null) {
    const record = err as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [
      record.message,
      record.details,
      record.hint,
      record.code ? `code: ${record.code}` : null,
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(' — ')
  }

  if (typeof err === 'string' && err) return err
  return fallback
}

export function logSaveCanError(err: unknown, context?: Record<string, unknown>): void {
  console.error('[SAVE_CAN_ERROR]', err)
  if (context) console.error('[SAVE_CAN_ERROR] context', context)
  try {
    console.error('[SAVE_CAN_ERROR] (json)', JSON.stringify(err, null, 2))
  } catch {
    // ignore circular refs
  }
}

export function toSupabaseCanRow(userId: string, can: CanInsert): Record<string, unknown> {
  const normalized = normalizeCanTradeFields(can)

  const row: Record<string, unknown> = {
    user_id: userId,
    barcode: nullIfEmpty(normalized.barcode ?? null),
    name: nullIfEmpty(normalized.name ?? null),
    brand: nullIfEmpty(normalized.brand ?? null),
    flavor: nullIfEmpty(normalized.flavor ?? null),
    volume: nullIfEmpty(normalized.volume ?? null),
    country: nullIfEmpty(normalized.country ?? null),
    country_variant: nullIfEmpty(normalized.country_variant ?? null),
    image_url: nullIfEmpty(normalized.image_url ?? null),
    image_source: normalized.image_source ?? 'placeholder',
    user_image_url: nullIfEmpty(normalized.user_image_url ?? null),
    master_image_url: nullIfEmpty(normalized.master_image_url ?? null),
    off_image_url: nullIfEmpty(normalized.off_image_url ?? null),
    opened: normalized.opened ?? false,
    purchase_date: nullIfEmpty(normalized.purchase_date ?? null),
    available_for_trade: normalized.available_for_trade ?? false,
    notes: nullIfEmpty(normalized.notes ?? null),
    rarity: normalized.rarity ?? 'unknown',
    quantity: normalized.quantity ?? 1,
    is_wishlist: normalized.is_wishlist ?? false,
    wishlist_status: normalized.is_wishlist ? (normalized.wishlist_status ?? 'wanted') : null,
    wanted: normalized.wanted ?? false,
  }

  if (normalized.master_can_id) {
    row.master_can_id = normalized.master_can_id
  }

  if (normalized.id) {
    row.id = normalized.id
  }

  return row
}

export function toSupabaseCanUpdate(updates: CanUpdate): Record<string, unknown> {
  const normalized = normalizeCanTradeFields(updates)
  const row: Record<string, unknown> = {}

  if (normalized.barcode !== undefined) row.barcode = nullIfEmpty(normalized.barcode)
  if (normalized.name !== undefined) row.name = nullIfEmpty(normalized.name)
  if (normalized.brand !== undefined) row.brand = nullIfEmpty(normalized.brand)
  if (normalized.flavor !== undefined) row.flavor = nullIfEmpty(normalized.flavor)
  if (normalized.volume !== undefined) row.volume = nullIfEmpty(normalized.volume)
  if (normalized.country !== undefined) row.country = nullIfEmpty(normalized.country)
  if (normalized.country_variant !== undefined) {
    row.country_variant = nullIfEmpty(normalized.country_variant)
  }
  if (normalized.image_url !== undefined) row.image_url = nullIfEmpty(normalized.image_url)
  if (normalized.image_source !== undefined) row.image_source = normalized.image_source
  if (normalized.user_image_url !== undefined) {
    row.user_image_url = nullIfEmpty(normalized.user_image_url)
  }
  if (normalized.master_image_url !== undefined) {
    row.master_image_url = nullIfEmpty(normalized.master_image_url)
  }
  if (normalized.off_image_url !== undefined) row.off_image_url = nullIfEmpty(normalized.off_image_url)
  if (normalized.opened !== undefined) row.opened = normalized.opened
  if (normalized.purchase_date !== undefined) {
    row.purchase_date = nullIfEmpty(normalized.purchase_date)
  }
  if (normalized.available_for_trade !== undefined) {
    row.available_for_trade = normalized.available_for_trade
  }
  if (normalized.notes !== undefined) row.notes = nullIfEmpty(normalized.notes)
  if (normalized.rarity !== undefined) row.rarity = normalized.rarity
  if (normalized.quantity !== undefined) row.quantity = normalized.quantity
  if (normalized.is_wishlist !== undefined) row.is_wishlist = normalized.is_wishlist
  if (normalized.wishlist_status !== undefined) row.wishlist_status = normalized.wishlist_status
  if (normalized.wanted !== undefined) row.wanted = normalized.wanted
  if (normalized.master_can_id !== undefined) row.master_can_id = normalized.master_can_id

  return row
}

export function stripExtendedCanColumns(row: Record<string, unknown>): Record<string, unknown> {
  const next = { ...row }
  for (const key of EXTENDED_CAN_COLUMNS) {
    delete next[key]
  }
  return next
}

export function shouldRetryWithoutExtendedColumns(err: unknown): boolean {
  return isMissingColumnError(err)
}
