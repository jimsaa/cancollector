import type {
  PendingCanSuggestion,
  PendingCanSuggestionInsert,
  PendingSuggestionStatus,
} from '../types/pendingSuggestion'
import { generateId } from './id'

const KEY = 'cancollector-pending-suggestions'

const EMPTY_FIELDS = {
  brand: null,
  category: null,
  flavor: null,
  variant_name: null,
  volume: null,
  country: null,
  product_page_url: null,
  source_url: null,
  suggestion_type: 'new_master' as const,
  suggested_master_can_id: null,
} as const

function normalizeRow(raw: PendingCanSuggestion): PendingCanSuggestion {
  return {
    ...EMPTY_FIELDS,
    ...raw,
    barcode: raw.barcode ?? null,
    product_name: raw.product_name ?? null,
    image_url: raw.image_url ?? null,
    submitted_by: raw.submitted_by ?? null,
  }
}

function readAll(): PendingCanSuggestion[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return (JSON.parse(raw) as PendingCanSuggestion[]).map(normalizeRow)
  } catch {
    return []
  }
}

function writeAll(items: PendingCanSuggestion[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function fetchLocalPendingSuggestions(
  status: PendingSuggestionStatus = 'pending',
): PendingCanSuggestion[] {
  return readAll()
    .filter((s) => s.status === status)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function findLocalPendingByBarcode(barcode: string): PendingCanSuggestion | null {
  const code = barcode.trim()
  return readAll().find((s) => (s.barcode ?? '').trim() === code && s.status === 'pending') ?? null
}

export function createLocalPendingSuggestion(
  input: PendingCanSuggestionInsert,
): PendingCanSuggestion {
  if (input.barcode?.trim()) {
    const existing = findLocalPendingByBarcode(input.barcode)
    if (existing) {
      const updated: PendingCanSuggestion = {
        ...existing,
        product_name: input.product_name ?? existing.product_name,
        image_url: input.image_url ?? existing.image_url,
        source: input.source,
        submitted_by: input.submitted_by ?? existing.submitted_by,
        brand: input.brand ?? existing.brand,
        category: input.category ?? existing.category,
        flavor: input.flavor ?? existing.flavor,
        variant_name: input.variant_name ?? existing.variant_name,
        volume: input.volume ?? existing.volume,
        country: input.country ?? existing.country,
        product_page_url: input.product_page_url ?? existing.product_page_url,
        source_url: input.source_url ?? existing.source_url,
        suggestion_type: input.suggestion_type ?? existing.suggestion_type,
        suggested_master_can_id:
          input.suggested_master_can_id ?? existing.suggested_master_can_id,
      }
      writeAll(readAll().map((s) => (s.id === existing.id ? updated : s)))
      return updated
    }
  }

  const created: PendingCanSuggestion = normalizeRow({
    id: generateId(),
    barcode: input.barcode?.trim() ?? null,
    product_name: input.product_name ?? null,
    brand: input.brand ?? null,
    category: input.category ?? null,
    flavor: input.flavor ?? null,
    variant_name: input.variant_name ?? null,
    volume: input.volume ?? null,
    country: input.country ?? null,
    image_url: input.image_url ?? null,
    product_page_url: input.product_page_url ?? null,
    source_url: input.source_url ?? null,
    source: input.source,
    submitted_by: input.submitted_by ?? null,
    suggestion_type: input.suggestion_type ?? 'new_master',
    suggested_master_can_id: input.suggested_master_can_id ?? null,
    created_at: new Date().toISOString(),
    status: 'pending',
  })
  writeAll([created, ...readAll()])
  return created
}

export function updateLocalPendingSuggestion(
  id: string,
  patch: Partial<PendingCanSuggestion>,
): PendingCanSuggestion {
  const items = readAll()
  const index = items.findIndex((s) => s.id === id)
  if (index === -1) throw new Error('Suggestion not found')
  const updated = normalizeRow({ ...items[index], ...patch })
  items[index] = updated
  writeAll(items)
  return updated
}
