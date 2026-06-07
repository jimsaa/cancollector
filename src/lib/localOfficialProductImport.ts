import type { OfficialProductImportFile, OfficialProductImportRecord } from '../types/officialProductImport'
import type { PendingCanSuggestion, PendingSuggestionSource, PendingSuggestionStatus } from '../types/pendingSuggestion'
import { createLocalPendingSuggestion, fetchLocalPendingSuggestions } from './localPendingSuggestions'

const IMPORT_FILE_KEY = 'cancollector-official-import-file'

export function fetchLocalOfficialImportFile(): OfficialProductImportFile {
  try {
    const raw = localStorage.getItem(IMPORT_FILE_KEY)
    if (raw) return JSON.parse(raw) as OfficialProductImportFile
  } catch {
    // fall through
  }

  return {
    scraped_at: new Date(0).toISOString(),
    source_page_url: 'https://www.monsterenergy.com/en-us/energy-drinks/',
    product_count: 0,
    products: [],
  }
}

export function storeLocalOfficialImportFile(file: OfficialProductImportFile): void {
  localStorage.setItem(IMPORT_FILE_KEY, JSON.stringify(file))
}

export function fetchLocalPendingBySource(
  source: PendingSuggestionSource,
  status: PendingSuggestionStatus = 'pending',
): PendingCanSuggestion[] {
  return fetchLocalPendingSuggestions(status).filter((row) => row.source === source)
}

function findLocalPendingByPageUrl(pageUrl: string): PendingCanSuggestion | null {
  const normalized = pageUrl.trim()
  return (
    fetchLocalPendingSuggestions('pending').find(
      (row) => row.product_page_url?.trim() === normalized,
    ) ?? null
  )
}

function findLocalPendingByName(productName: string): PendingCanSuggestion | null {
  const key = productName.trim().toLowerCase()
  return (
    fetchLocalPendingSuggestions('pending').find(
      (row) => (row.product_name ?? '').trim().toLowerCase() === key,
    ) ?? null
  )
}

export function createLocalOfficialPendingSuggestions(
  products: OfficialProductImportRecord[],
): number {
  let created = 0

  for (const product of products) {
    if (findLocalPendingByPageUrl(product.product_page_url)) continue
    if (findLocalPendingByName(product.product_name)) continue

    createLocalPendingSuggestion({
      barcode: null,
      product_name: product.product_name,
      brand: product.brand,
      category: product.category,
      flavor: product.flavor,
      variant_name: product.flavor,
      volume: null,
      country: 'US',
      image_url: product.image_url,
      product_page_url: product.product_page_url,
      source_url: product.product_page_url,
      source: 'official_site',
      submitted_by: null,
    })
    created++
  }

  return created
}

export function seedLocalOfficialImportFromJson(file: OfficialProductImportFile): void {
  storeLocalOfficialImportFile(file)
}
