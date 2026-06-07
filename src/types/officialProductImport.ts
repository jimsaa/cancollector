/** Record produced by scripts/import-monster-products.ts */
export interface OfficialProductImportRecord {
  brand: string
  product_name: string
  category: string
  flavor: string | null
  product_page_url: string
  image_url: string | null
  source: 'official_site'
  status: 'pending'
  external_product_id: string | null
}

export interface OfficialProductImportFile {
  scraped_at: string
  source_page_url: string
  product_count: number
  products: OfficialProductImportRecord[]
}
