/** Columns added in later migrations — omitted on fallback if DB is behind. */

export const EXTENDED_MASTER_CAN_COLUMNS = [

  'reference_image_status',

  'off_preview_image_url',

  'reference_image_url',

  'image_source',

  'reference_image_approved',

  'category',

  'source',

  'source_url',

  'country',

  'variant_name',

  'barcode_source',

] as const



function isMissingColumnError(err: unknown): boolean {

  if (!err || typeof err !== 'object') return false

  const record = err as { code?: string; message?: string }

  if (record.code === 'PGRST204') return true

  const msg = (record.message ?? '').toLowerCase()

  return msg.includes('column') && (msg.includes('does not exist') || msg.includes('could not find'))

}



export function formatMasterCanError(err: unknown, fallback = 'Master can save failed'): string {

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



export function stripExtendedMasterColumns(row: Record<string, unknown>): Record<string, unknown> {

  const next = { ...row }

  for (const key of EXTENDED_MASTER_CAN_COLUMNS) {

    delete next[key]

  }

  if (!next.image_url && row.reference_image_url) {

    next.image_url = row.reference_image_url

  }

  return next

}



export function shouldRetryMasterCanWithoutExtendedColumns(err: unknown): boolean {

  return isMissingColumnError(err)

}



export function isDuplicateKeyError(err: unknown): boolean {

  if (!err || typeof err !== 'object') return false

  const record = err as { code?: string; message?: string }

  if (record.code === '23505') return true

  const msg = (record.message ?? '').toLowerCase()

  return msg.includes('duplicate key') || msg.includes('unique constraint')

}



/** Empty strings violate master_cans_barcode_unique_idx — only persist real barcodes. */

const PLACEHOLDER_BARCODES = new Set(['empty', 'n/a', 'na', 'none', 'null', 'unknown', 'tbd'])

function isRawPlaceholderBarcode(barcode: string): boolean {
  return PLACEHOLDER_BARCODES.has(barcode.toLowerCase())
}

export function isPlaceholderBarcode(barcode: string | null | undefined): boolean {
  const trimmed = barcode?.trim()
  if (!trimmed) return false
  return isRawPlaceholderBarcode(trimmed)
}

export function normalizeMasterBarcode(barcode: string | null | undefined): string | null {

  const trimmed = barcode?.trim()

  if (!trimmed) return null
  if (isRawPlaceholderBarcode(trimmed)) return null

  return trimmed

}



export function isBarcodeDuplicateError(err: unknown): boolean {

  if (!isDuplicateKeyError(err)) return false

  const msg =

    typeof err === 'object' && err !== null

      ? String((err as { message?: string }).message ?? '').toLowerCase()

      : ''

  return msg.includes('barcode')

}


