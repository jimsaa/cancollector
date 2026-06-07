import { useState } from 'react'
import { Copy, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  copyToClipboard,
  getPublicProfileShareUrl,
  shareToFacebook,
  shareToTwitter,
  shareToWhatsApp,
} from '../../lib/socialShare'

interface SocialShareButtonsProps {
  username: string
  shareTitle: string
  shareDescription: string
  primaryLabel?: string
}

export function SocialShareButtons({
  username,
  shareTitle,
  shareDescription,
  primaryLabel = 'Copy Public Profile Link',
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const url = getPublicProfileShareUrl(username)

  const handleCopy = async () => {
    const ok = await copyToClipboard(url)
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <Button fullWidth onClick={handleCopy}>
        <Copy size={16} className="mr-2 inline" />
        {copied ? 'Link copied!' : primaryLabel}
      </Button>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" className="text-xs" onClick={() => shareToFacebook(url)}>
          <Share2 size={14} className="mr-1 inline" />
          Facebook
        </Button>
        <Button variant="secondary" className="text-xs" onClick={() => shareToTwitter(url, shareTitle)}>
          <Share2 size={14} className="mr-1 inline" />
          X
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          onClick={() => shareToWhatsApp(url, shareDescription)}
        >
          <MessageCircle size={14} className="mr-1 inline" />
          WhatsApp
        </Button>
      </div>
    </div>
  )
}
