const EXCLUDED_OFF_IMAGE_PARTS = [
  'ingredients',
  'nutrition',
  'packaging',
  'barcode',
  'nutrition_facts',
  'image_type_ingredients',
  'image_type_nutrition',
  'image_type_packaging',
]

/** OFF URLs that are not front product photos (ingredients, nutrition, packaging, barcode). */
export function isExcludedOffImageUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return EXCLUDED_OFF_IMAGE_PARTS.some((part) => lower.includes(part))
}

/** Raw OFF upload slots are numeric-only keys — not cropped front photos. */
export function isRawOffBarcodeImageUrl(url: string): boolean {
  const match = url.match(/\/images\/products\/[^/]+\/(\d+)(?:\.\d+)?\.(?:jpg|jpeg|png|webp)/i)
  return Boolean(match)
}

/**
 * Portrait images with an extreme aspect ratio are usually nutrition/ingredient panels,
 * not front can photos.
 */
export function isUnlikelyFrontCanAspect(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return true
  if (height <= width) return false
  const ratio = height / width
  if (ratio > 1.75) return true
  if (ratio > 1.4 && width < 260) return true
  return false
}

export function isLikelyFrontCanImageUrl(url: string): Promise<boolean> {
  if (isExcludedOffImageUrl(url) || isRawOffBarcodeImageUrl(url)) {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve(!isUnlikelyFrontCanAspect(img.naturalWidth, img.naturalHeight))
    }
    img.onerror = () => resolve(false)
    img.src = url
  })
}
