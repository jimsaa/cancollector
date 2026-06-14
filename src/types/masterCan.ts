import type { Rarity } from './can'

import type { MasterImageSource } from './masterImageSource'

import type { ReferenceImageStatus } from './referenceImageStatus'

import type { UserCanStatusType } from './userCanStatus'



export const ENERGY_BRANDS = [

  'Monster',

  'Rockstar',

  'Red Bull',

  'Celsius',

  'Nocco',

  'Generic Energy',

] as const



export type EnergyBrand = (typeof ENERGY_BRANDS)[number]



export type MasterBrandFilter = EnergyBrand | 'all'

export type MasterBarcodeSource = 'user_scan' | 'admin_manual'



/** UI labels for brand filters (product names, not app branding). */

export const BRAND_FILTER_LABELS: Record<EnergyBrand, string> = {

  Monster: 'Monster Energy',

  Rockstar: 'Rockstar',

  'Red Bull': 'Red Bull',

  Celsius: 'Celsius',

  Nocco: 'Nocco',

  'Generic Energy': 'Generic Energy',

}



export interface MasterCan {

  id: string

  brand: string

  product_name: string

  flavor: string | null

  variant_name: string | null

  volume: string | null

  barcode: string | null

  barcode_source: MasterBarcodeSource | null

  sku: string | null

  external_product_id: string | null

  corrected_by: string | null

  corrected_at: string | null

  country: string | null

  image_url: string | null

  reference_image_url: string | null

  reference_image_status: ReferenceImageStatus

  /** OFF lookup preview — never used in collection until admin approves a different image. */

  off_preview_image_url: string | null

  image_source: MasterImageSource | null

  source: string | null

  source_url: string | null

  category: string | null

  collection_set: string | null

  base_product_key: string | null

  variant_country: string | null

  variant_region: string | null

  language_code: string | null

  release_date: string | null

  discontinued_date: string | null

  catalog_date: string | null

  collector_summary: string | null

  rarity: Rarity

  release_year: number | null

  discontinued: boolean

  active: boolean

  created_at?: string

  updated_at?: string

}



export interface CollectionProgress {

  owned: number

  total: number

  percentage: number

  missing: number

}



export interface MasterCanCommunityCounts {
  got: number
  want: number
  need: number
}

export interface MasterCanWithStatus extends MasterCan {

  owned: boolean

  wanted: boolean

  needed: boolean

  /** Explicit got marker from user_can_status (may match owned) */
  markedGot: boolean

  userStatus: UserCanStatusType | null

}


