import { getYouTubeEmbedUrl } from '../../lib/youtube'

interface YouTubePreviewProps {
  url: string
  title?: string
}

export function YouTubePreview({ url, title = 'YouTube video' }: YouTubePreviewProps) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <div className="overflow-hidden rounded-xl border border-monster-border bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
