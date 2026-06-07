import type { ProductLookup } from '../types/can'
import {
  isExcludedOffImageUrl,
  isLikelyFrontCanImageUrl,
  isRawOffBarcodeImageUrl,
} from './imagePortrait'

interface OffSelectedImageBucket {
  display?: Record<string, string>
  small?: Record<string, string>
  thumb?: Record<string, string>
}

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
  selected_images?: {
    front?: OffSelectedImageBucket
  }
}

interface OpenFoodFactsResponse {
  status: number
  product?: OpenFoodFactsProduct
}

function firstUrl(bucket: OffSelectedImageBucket | undefined): string | null {
  if (!bucket) return null
  for (const size of ['display', 'small', 'thumb'] as const) {
    const urls = Object.values(bucket[size] ?? {}).filter(Boolean)
    if (urls.length > 0) return urls[0]
  }
  return null
}

/** Prefer OFF front product image only — never ingredients, nutrition, packaging, or barcode. */
export function pickFrontImageCandidate(product: OpenFoodFactsProduct): string | null {
  const selectedFront = firstUrl(product.selected_images?.front)
  if (selectedFront && !isExcludedOffImageUrl(selectedFront) && !isRawOffBarcodeImageUrl(selectedFront)) {
    return selectedFront
  }

  const legacyFront = [product.image_front_url, product.image_front_small_url].find(
    (url) => url && !isExcludedOffImageUrl(url) && !isRawOffBarcodeImageUrl(url),
  )
  if (legacyFront) return legacyFront

  // Do not fall back to generic image_url — it may be ingredients, nutrition, or packaging.
  return null
}

async function pickValidatedFrontImage(product: OpenFoodFactsProduct): Promise<string | null> {
  const candidate = pickFrontImageCandidate(product)
  if (!candidate) return null
  const acceptable = await isLikelyFrontCanImageUrl(candidate)
  return acceptable ? candidate : null
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

function mapProduct(barcode: string, product: OpenFoodFactsProduct, imageUrl: string | null): ProductLookup {
  return {
    barcode: product.code ?? barcode,
    name: product.product_name?.trim() || null,
    brand: product.brands?.split(',')[0]?.trim() || null,
    flavor: product.generic_name?.trim() || null,
    volume: product.quantity?.trim() || null,
    country: pickCountry(product),
    image_url: imageUrl,
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

  const imageUrl = await pickValidatedFrontImage(data.product)
  return mapProduct(trimmed, data.product, imageUrl)
}
