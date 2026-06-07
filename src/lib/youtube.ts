const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']

export interface YouTubeParseResult {
  videoId: string
  embedUrl: string
  watchUrl: string
}

function extractVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v')
      }
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/)
      if (shortsMatch) return shortsMatch[1]
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/)
      if (embedMatch) return embedMatch[1]
    }
  } catch {
    return null
  }

  return null
}

export function isValidYouTubeUrl(url: string): boolean {
  if (!url.trim()) return true
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')
    if (!YOUTUBE_HOSTS.some((h) => host === h.replace(/^www\./, ''))) return false
    return extractVideoId(trimmed) !== null
  } catch {
    return false
  }
}

export function parseYouTubeUrl(url: string): YouTubeParseResult | null {
  const videoId = extractVideoId(url)
  if (!videoId) return null
  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  return parseYouTubeUrl(url)?.embedUrl ?? null
}
