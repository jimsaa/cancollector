/** Brand catalog import sources — extensible for future scrapers. */
export type MasterImportStatus = 'active' | 'planned'

export interface MasterImportSource {
  id: string
  brand: string
  label: string
  description: string
  status: MasterImportStatus
  /** npm script name, e.g. import:monster-products */
  importScript?: string
  /** Public JSON path served by Vite */
  jsonPath?: string
  /** Admin review route */
  reviewRoute: string
  /** pending_can_suggestions.source value */
  suggestionSource: 'official_site'
  /** Official catalog page scraped */
  sourcePageUrl?: string
}

export const MASTER_IMPORT_SOURCES: MasterImportSource[] = [
  {
    id: 'monster',
    brand: 'Monster',
    label: 'Monster Energy',
    description: 'Official US product catalog with reference images from monsterenergy.com',
    status: 'active',
    importScript: 'import:monster-products',
    jsonPath: '/data/imports/monster-products.json',
    reviewRoute: '/admin/imports/monster-products',
    suggestionSource: 'official_site',
    sourcePageUrl: 'https://www.monsterenergy.com/en-us/energy-drinks/',
  },
  {
    id: 'red-bull',
    brand: 'Red Bull',
    label: 'Red Bull',
    description: 'Official Red Bull product catalog (planned)',
    status: 'planned',
    reviewRoute: '/admin/imports/red-bull',
    suggestionSource: 'official_site',
  },
  {
    id: 'rockstar',
    brand: 'Rockstar',
    label: 'Rockstar',
    description: 'Official Rockstar Energy product catalog (planned)',
    status: 'planned',
    reviewRoute: '/admin/imports/rockstar',
    suggestionSource: 'official_site',
  },
  {
    id: 'celsius',
    brand: 'Celsius',
    label: 'Celsius',
    description: 'Official Celsius product catalog (planned)',
    status: 'planned',
    reviewRoute: '/admin/imports/celsius',
    suggestionSource: 'official_site',
  },
  {
    id: 'nocco',
    brand: 'Nocco',
    label: 'Nocco',
    description: 'Official Nocco product catalog (planned)',
    status: 'planned',
    reviewRoute: '/admin/imports/nocco',
    suggestionSource: 'official_site',
  },
]

export function getActiveImportSources(): MasterImportSource[] {
  return MASTER_IMPORT_SOURCES.filter((s) => s.status === 'active')
}

export function getImportSourceById(id: string): MasterImportSource | undefined {
  return MASTER_IMPORT_SOURCES.find((s) => s.id === id)
}
