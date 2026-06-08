import type { ProductLookup } from '../types/can'

import { isExcludedOffImageUrl, isRawOffBarcodeImageUrl } from './imagePortrait'



interface OffSelectedImageBucket {

  display?: Record<string, string>

  small?: Record<string, string>

  thumb?: Record<string, string>

}



interface OpenFoodFactsProduct {

  code?: string

  product_name?: string

  product_name_en?: string

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

  status_verbose?: string

  product?: OpenFoodFactsProduct

}



const OFF_API = 'https://world.openfoodfacts.org/api/v2/product'



function firstUrl(bucket: OffSelectedImageBucket | undefined): string | null {

  if (!bucket) return null

  for (const size of ['display', 'small', 'thumb'] as const) {

    const urls = Object.values(bucket[size] ?? {}).filter(Boolean)

    if (urls.length > 0) return urls[0]

  }

  return null

}



function isUsableOffImage(url: string | null | undefined): url is string {

  if (!url?.trim()) return false

  if (isExcludedOffImageUrl(url)) return false

  if (isRawOffBarcodeImageUrl(url)) return false

  return true

}



/** Best available front/product image from OFF (sync — no network validation). */

export function pickBestOffImage(product: OpenFoodFactsProduct): string | null {

  const selectedFront = firstUrl(product.selected_images?.front)

  if (isUsableOffImage(selectedFront)) return selectedFront



  for (const url of [

    product.image_front_url,

    product.image_front_small_url,

    product.image_url,

  ]) {

    if (isUsableOffImage(url)) return url

  }



  return null

}



/** @deprecated Use pickBestOffImage */

export function pickFrontImageCandidate(product: OpenFoodFactsProduct): string | null {

  return pickBestOffImage(product)

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



function pickProductName(product: OpenFoodFactsProduct): string | null {

  return (

    product.product_name?.trim() ||

    product.product_name_en?.trim() ||

    product.generic_name?.trim() ||

    null

  )

}



function mapProduct(barcode: string, product: OpenFoodFactsProduct): ProductLookup {

  return {

    barcode: product.code ?? barcode,

    name: pickProductName(product),

    brand: product.brands?.split(',')[0]?.trim() || null,

    flavor: product.generic_name?.trim() || null,

    volume: product.quantity?.trim() || null,

    country: pickCountry(product),

    image_url: pickBestOffImage(product),

  }

}



export async function fetchProductByBarcode(barcode: string): Promise<ProductLookup | null> {

  const trimmed = barcode.trim()

  if (!trimmed) return null



  const url = `${OFF_API}/${encodeURIComponent(trimmed)}.json`



  let response: Response

  try {

    response = await fetch(url, { cache: 'no-store' })

  } catch (err) {

    if (import.meta.env.DEV) {

      console.error('[OpenFoodFacts] Network error', { barcode: trimmed, url, err })

    }

    throw err

  }



  if (!response.ok) {

    const err = new Error(`Open Food Facts HTTP ${response.status} for barcode ${trimmed}`)

    if (import.meta.env.DEV) {

      console.error('[OpenFoodFacts] Bad response', { barcode: trimmed, status: response.status, url })

    }

    throw err

  }



  let data: OpenFoodFactsResponse

  try {

    data = (await response.json()) as OpenFoodFactsResponse

  } catch (err) {

    if (import.meta.env.DEV) {

      console.error('[OpenFoodFacts] Invalid JSON', { barcode: trimmed, err })

    }

    throw err

  }



  if (data.status !== 1 || !data.product) {

    if (import.meta.env.DEV) {

      console.info('[OpenFoodFacts] Product not found', {

        barcode: trimmed,

        status: data.status,

        status_verbose: data.status_verbose,

      })

    }

    return null

  }



  const mapped = mapProduct(trimmed, data.product)



  if (import.meta.env.DEV) {

    console.info('[OpenFoodFacts] Product found', {

      barcode: trimmed,

      name: mapped.name,

      brand: mapped.brand,

      image: mapped.image_url ? 'yes' : 'no',

    })

  }



  return mapped

}


