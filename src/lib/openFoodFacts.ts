import type { ProductLookup } from '../types/can'

interface OpenFoodFactsProduct {
  code?: string
  product_name?: string
  brands?: string
  generic_name?: string
  quantity?: string
  countries?: string
  countries_tags?: string[]
  image_url?: string
  image_front_url?: string
  image_front_small_url?: string
}

interface OpenFoodFactsResponse {
  status: number
  product?: OpenFoodFactsProduct
}

function pickImage(product: OpenFoodFactsProduct): string | null {
  return (
    product.image_front_url ??
    product.image_url ??
    product.image_front_small_url ??
    null
  )
}

function pickCountry(product: OpenFoodFactsProduct): string | null {
  if (product.countries) {
    return product.countries.split(',')[0]?.trim() ?? null
  }
  if (product.countries_tags?.[0]) {
    return product.countries_tags[0].replace(/^en:/, '').replace(/-/g, ' ')
  }
  return null
}

function mapProduct(barcode: string, product: OpenFoodFactsProduct): ProductLookup {
  return {
    barcode: product.code ?? barcode,
    name: product.product_name?.trim() || null,
    brand: product.brands?.split(',')[0]?.trim() || null,
    flavor: product.generic_name?.trim() || null,
    volume: product.quantity?.trim() || null,
    country: pickCountry(product),
    image_url: pickImage(product),
  }
}

export async function fetchProductByBarcode(barcode: string): Promise<ProductLookup | null> {
  const trimmed = barcode.trim()
  if (!trimmed) return null

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json`,
  )

  if (!response.ok) {
    throw new Error(`Product lookup failed (${response.status})`)
  }

  const data: OpenFoodFactsResponse = await response.json()

  if (data.status !== 1 || !data.product) {
    return null
  }

  return mapProduct(trimmed, data.product)
}
