import type {
  PendingCanSuggestion,
  PendingCanSuggestionInsert,
  PendingSuggestionStatus,
} from '../types/pendingSuggestion'
import { generateId } from './id'

const KEY = 'cancollector-pending-suggestions'

function readAll(): PendingCanSuggestion[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as PendingCanSuggestion[]
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
  return readAll().find((s) => s.barcode.trim() === code && s.status === 'pending') ?? null
}

export function createLocalPendingSuggestion(
  input: PendingCanSuggestionInsert,
): PendingCanSuggestion {
  const existing = findLocalPendingByBarcode(input.barcode)
  if (existing) {
    const updated: PendingCanSuggestion = {
      ...existing,
      product_name: input.product_name ?? existing.product_name,
      image_url: input.image_url ?? existing.image_url,
      source: input.source,
      submitted_by: input.submitted_by ?? existing.submitted_by,
    }
    writeAll(readAll().map((s) => (s.id === existing.id ? updated : s)))
    return updated
  }

  const created: PendingCanSuggestion = {
    id: generateId(),
    barcode: input.barcode.trim(),
    product_name: input.product_name ?? null,
    image_url: input.image_url ?? null,
    source: input.source,
    submitted_by: input.submitted_by ?? null,
    created_at: new Date().toISOString(),
    status: 'pending',
  }
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
  const updated = { ...items[index], ...patch }
  items[index] = updated
  writeAll(items)
  return updated
}
