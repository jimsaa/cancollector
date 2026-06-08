import bundledPlaceholderUrl from '../assets/placeholder-can.svg'

const DEFAULT_PLACEHOLDER_KEY = 'cantrove-default-placeholder-url'

let cachedPlaceholder: string | null = null

/** Bundled generic green can — not branded. */
export const BUNDLED_PLACEHOLDER_CAN_IMAGE = bundledPlaceholderUrl

export function getDefaultPlaceholderImageUrl(): string {
  if (cachedPlaceholder) return cachedPlaceholder
  try {
    const stored = localStorage.getItem(DEFAULT_PLACEHOLDER_KEY)?.trim()
    if (stored) {
      cachedPlaceholder = stored
      return stored
    }
  } catch {
    // ignore
  }
  return BUNDLED_PLACEHOLDER_CAN_IMAGE
}

export function setDefaultPlaceholderImageUrl(url: string | null): void {
  try {
    if (url?.trim()) {
      localStorage.setItem(DEFAULT_PLACEHOLDER_KEY, url.trim())
      cachedPlaceholder = url.trim()
    } else {
      localStorage.removeItem(DEFAULT_PLACEHOLDER_KEY)
      cachedPlaceholder = null
    }
  } catch {
    // ignore
  }
}
