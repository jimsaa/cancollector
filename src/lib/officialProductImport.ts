import type { OfficialProductImportFile, OfficialProductImportRecord } from '../types/officialProductImport'
import { getImportSourceById } from '../types/masterImport'
import type { PendingCanSuggestion } from '../types/pendingSuggestion'
import {
  createLocalOfficialPendingSuggestions,
  fetchLocalOfficialImportFile,
  fetchLocalPendingBySource,
  storeLocalOfficialImportFile,
} from './localOfficialProductImport'
import {
  fetchPendingSuggestions,
  importOfficialProductsToPending,
} from './pendingSuggestions'
import { useGuestStorage } from './guestStorage'
import { isConfigured } from './mode'

const MONSTER_IMPORT = getImportSourceById('monster')
const IMPORT_JSON_URL = MONSTER_IMPORT?.jsonPath ?? '/data/imports/monster-products.json'

async function fetchImportJsonFromPublic(): Promise<OfficialProductImportFile | null> {
  try {
    const response = await fetch(IMPORT_JSON_URL, { cache: 'no-cache' })
    if (!response.ok) return null
    return (await response.json()) as OfficialProductImportFile
  } catch {
    return null
  }
}

export async function fetchOfficialImportFile(): Promise<OfficialProductImportFile> {
  if (!isConfigured || useGuestStorage()) {
    const fromPublic = await fetchImportJsonFromPublic()
    if (fromPublic) {
      storeLocalOfficialImportFile(fromPublic)
      return fromPublic
    }
    return fetchLocalOfficialImportFile()
  }

  const response = await fetch(IMPORT_JSON_URL, { cache: 'no-cache' })
  if (!response.ok) {
    throw new Error(`Could not load import file (HTTP ${response.status})`)
  }
  return (await response.json()) as OfficialProductImportFile
}

export interface OfficialImportSyncResult {
  imported: number
  skipped: number
  total: number
}

function isDuplicateInPending(
  product: OfficialProductImportRecord,
  pending: PendingCanSuggestion[],
): boolean {
  const pageUrl = product.product_page_url.trim()
  const nameKey = product.product_name.trim().toLowerCase()
  return pending.some((row) => {
    if (row.status !== 'pending' || row.source !== 'official_site') return false
    if (row.product_page_url?.trim() === pageUrl) return true
    return (row.product_name ?? '').trim().toLowerCase() === nameKey
  })
}

export async function syncOfficialProductsToPendingQueue(): Promise<OfficialImportSyncResult> {
  const file = await fetchOfficialImportFile()
  const pending = await fetchOfficialImportPending()

  const toInsert = file.products.filter((product) => !isDuplicateInPending(product, pending))

  if (toInsert.length === 0) {
    return { imported: 0, skipped: file.products.length, total: file.products.length }
  }

  if (!isConfigured || useGuestStorage()) {
    const imported = createLocalOfficialPendingSuggestions(toInsert)
    return {
      imported,
      skipped: file.products.length - imported,
      total: file.products.length,
    }
  }

  const imported = await importOfficialProductsToPending(toInsert)
  return {
    imported,
    skipped: file.products.length - imported,
    total: file.products.length,
  }
}

export async function fetchOfficialImportPending(): Promise<PendingCanSuggestion[]> {
  if (!isConfigured || useGuestStorage()) {
    return fetchLocalPendingBySource('official_site', 'pending')
  }

  const all = await fetchPendingSuggestions('pending')
  return all.filter((row) => row.source === 'official_site')
}
