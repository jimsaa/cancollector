export function getAbsoluteUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
  }
  return path
}

export function getPublicProfileShareUrl(username: string): string {
  return getAbsoluteUrl(`/u/${encodeURIComponent(username.toLowerCase())}`)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function shareToFacebook(url: string): void {
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function shareToTwitter(url: string, text: string): void {
  window.open(
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function shareToWhatsApp(url: string, text: string): void {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    '_blank',
    'noopener,noreferrer',
  )
}
