import type { Rarity } from './can'

import type { MasterImageSource } from './masterImageSource'

import type { ReferenceImageStatus } from './referenceImageStatus'



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



export interface MasterCanWithStatus extends MasterCan {

  owned: boolean

  wanted: boolean

}


