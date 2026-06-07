import type { Rarity } from './can'

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

export interface MasterCan {
  id: string
  brand: string
  product_name: string
  flavor: string | null
  variant_name: string | null
  volume: string | null
  barcode: string | null
  country: string | null
  image_url: string | null
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
