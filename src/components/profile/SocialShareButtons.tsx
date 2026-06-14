import { useState } from 'react'

import { Copy, MessageCircle, Share2 } from 'lucide-react'

import { Button } from '../ui/Button'

import {

  copyToClipboard,

  getPublicProfileShareText,

  getPublicProfileShareUrl,

  shareToFacebook,

  shareToTwitter,

  shareToWhatsApp,

} from '../../lib/socialShare'



interface SocialShareButtonsProps {

  username: string

  collectedCount: number

  shareTitle?: string

  primaryLabel?: string

}



export function SocialShareButtons({

  username,

  collectedCount,

  shareTitle,

  primaryLabel = 'Copy Profile Link',

}: SocialShareButtonsProps) {

  const [copied, setCopied] = useState(false)

  const url = getPublicProfileShareUrl(username)

  const shareText = getPublicProfileShareText(username, collectedCount)

  const title = shareTitle ?? `My CanTrove collection — ${collectedCount} cans`



  const handleCopy = async () => {

    const ok = await copyToClipboard(shareText)

    setCopied(ok)

    if (ok) setTimeout(() => setCopied(false), 2000)

  }



  const handleCopyLinkOnly = async () => {

    const ok = await copyToClipboard(url)

    setCopied(ok)

    if (ok) setTimeout(() => setCopied(false), 2000)

  }



  return (

    <div className="flex flex-col gap-2">

      <p className="text-sm font-semibold text-white">Share your profile</p>

      <p className="whitespace-pre-line text-xs text-monster-muted">{shareText}</p>

      <Button fullWidth onClick={() => void handleCopy()}>

        <Copy size={16} className="mr-2 inline" />

        {copied ? 'Copied!' : primaryLabel}

      </Button>

      <Button variant="secondary" fullWidth className="text-xs" onClick={() => void handleCopyLinkOnly()}>

        <Copy size={14} className="mr-1 inline" />

        Copy link only

      </Button>

      <div className="grid grid-cols-3 gap-2">

        <Button variant="secondary" className="text-xs" onClick={() => shareToFacebook(url)}>

          <Share2 size={14} className="mr-1 inline" />

          Facebook

        </Button>

        <Button variant="secondary" className="text-xs" onClick={() => shareToTwitter(url, title)}>

          <Share2 size={14} className="mr-1 inline" />

          X

        </Button>

        <Button

          variant="secondary"

          className="text-xs"

          onClick={() => shareToWhatsApp(url, shareText)}

        >

          <MessageCircle size={14} className="mr-1 inline" />

          WhatsApp

        </Button>

      </div>

    </div>

  )

}


