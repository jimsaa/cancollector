export const MAX_IMAGE_WIDTH = 900
export const MAX_IMAGE_HEIGHT = 900
export const IMAGE_QUALITY = 0.75

/** Warn when local base64 exceeds this (~400 KB). */
export const LOCAL_IMAGE_WARN_BYTES = 400_000

/** Hard limit for local storage per image (~800 KB). */
export const LOCAL_IMAGE_MAX_BYTES = 800_000

export interface CompressedImage {
  blob: Blob
  dataUrl: string
  mimeType: string
  byteSize: number
  warning?: string
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image file'))
    }
    img.src = url
  })
}

function scaleDimensions(
  width: number,
  height: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  if (width <= maxW && height <= maxH) return { width, height }

  const ratio = Math.min(maxW / width, maxH / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
      type,
      quality,
    )
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to encode image'))
    reader.readAsDataURL(blob)
  })
}

async function encodeCanvas(canvas: HTMLCanvasElement): Promise<{ blob: Blob; mimeType: string }> {
  const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp')

  if (webpSupported) {
    try {
      const blob = await canvasToBlob(canvas, 'image/webp', IMAGE_QUALITY)
      return { blob, mimeType: 'image/webp' }
    } catch {
      // fall through to JPEG
    }
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', IMAGE_QUALITY)
  return { blob, mimeType: 'image/jpeg' }
}

export async function compressImageFile(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPEG, PNG, WebP, etc.)')
  }

  const img = await loadImage(file)
  const { width, height } = scaleDimensions(
    img.naturalWidth,
    img.naturalHeight,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT,
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image')

  ctx.drawImage(img, 0, 0, width, height)

  let { blob, mimeType } = await encodeCanvas(canvas)

  // Re-compress if still too large for localStorage
  if (blob.size > LOCAL_IMAGE_MAX_BYTES) {
    const smaller = await canvasToBlob(canvas, 'image/jpeg', 0.55)
    if (smaller.size < blob.size) {
      blob = smaller
      mimeType = 'image/jpeg'
    }
  }

  if (blob.size > LOCAL_IMAGE_MAX_BYTES) {
    throw new Error(
      `Image is still too large after compression (${Math.round(blob.size / 1024)} KB). Try a smaller photo.`,
    )
  }

  const dataUrl = await blobToDataUrl(blob)
  const byteSize = blob.size

  let warning: string | undefined
  if (byteSize > LOCAL_IMAGE_WARN_BYTES) {
    warning = `Large image (${Math.round(byteSize / 1024)} KB). This may use significant browser storage.`
  }

  return { blob, dataUrl, mimeType, byteSize, warning }
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}
