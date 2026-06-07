import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import type { Can } from '../../types/can'
import { TRADE_CONDITIONS, TRADE_LISTING_STATUSES } from '../../types/trade'
import type { PremiumFeatures } from '../../lib/premium'
import { useTradeListing } from '../../hooks/useTradeListing'
import { useGuestMessaging } from '../../hooks/useGuestMessaging'
import { isValidYouTubeUrl } from '../../lib/youtube'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { TradeExtraImages } from './TradeExtraImages'
import { YouTubePreview } from './YouTubePreview'

interface TradeListingEditorProps {
  can: Can
  premiumFeatures: PremiumFeatures
}

export function TradeListingEditor({ can, premiumFeatures }: TradeListingEditorProps) {
  const { triggerRegisterCTA } = useGuestMessaging()
  const { listing, loading, saving, error, save } = useTradeListing(
    can,
    premiumFeatures.maxActiveTradeListings,
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState(listing?.condition ?? 'unknown')
  const [tradeStatus, setTradeStatus] = useState(listing?.trade_status ?? 'available')
  const [askingFor, setAskingFor] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [shipping, setShipping] = useState(false)
  const [localPickup, setLocalPickup] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeError, setYoutubeError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!listing) return
    setTitle(listing.title)
    setDescription(listing.description)
    setCondition(listing.condition)
    setTradeStatus(listing.trade_status)
    setAskingFor(listing.asking_for)
    setCountry(listing.location_country ?? '')
    setCity(listing.location_city ?? '')
    setShipping(listing.shipping_available)
    setLocalPickup(listing.local_pickup_available)
    setYoutubeUrl(listing.youtube_url ?? '')
  }, [listing])

  const handleYoutubeBlur = () => {
    if (!youtubeUrl.trim()) {
      setYoutubeError(null)
      return
    }
    setYoutubeError(isValidYouTubeUrl(youtubeUrl) ? null : 'Enter a valid YouTube link')
  }

  const handleSave = async () => {
    if (!listing) return
    if (youtubeUrl.trim() && !isValidYouTubeUrl(youtubeUrl)) {
      setYoutubeError('Enter a valid YouTube link')
      return
    }
    try {
      await save({
        title,
        description,
        condition,
        trade_status: tradeStatus,
        asking_for: askingFor,
        location_country: country || null,
        location_city: city || null,
        shipping_available: shipping,
        local_pickup_available: localPickup,
        youtube_url: youtubeUrl.trim() || null,
      })
      triggerRegisterCTA('trade_listing')
      setMessage('Trade listing saved')
      setTimeout(() => setMessage(null), 2000)
    } catch {
      // error shown via hook
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-monster-muted">Loading trade listing...</p>
      </Card>
    )
  }

  if (!listing) {
    return (
      <Card>
        <p className="text-sm text-red-400">{error ?? 'Could not create trade listing'}</p>
        {error?.includes('Free plan') ? (
          <Link to="/premium" className="mt-2 inline-block text-xs text-monster-green hover:underline">
            Upgrade to Premium
          </Link>
        ) : null}
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-monster-green">
          Trade Listing Details
        </p>
        <p className="mt-1 text-xs text-monster-muted">
          Add details collectors see when browsing your trade offers.
        </p>
      </div>

      {!premiumFeatures.canUsePriorityTradeBadge &&
      premiumFeatures.maxActiveTradeListings === 1 ? (
        <p className="rounded-lg border border-monster-border bg-monster-dark px-3 py-2 text-xs text-monster-muted">
          Free plan: 1 active listing, up to {premiumFeatures.maxTradeImages} extra images.{' '}
          <Link to="/premium" className="text-monster-green hover:underline">
            Upgrade
          </Link>{' '}
          for unlimited listings and 5 images.
        </p>
      ) : null}

      <Input label="Listing title" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-monster-muted">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-xl border border-monster-border bg-monster-dark px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-monster-muted">Condition</span>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as typeof condition)}
          className="rounded-xl border border-monster-border bg-monster-dark px-3 py-2 text-sm text-white"
        >
          {TRADE_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-monster-muted">Listing status</span>
        <select
          value={tradeStatus}
          onChange={(e) => setTradeStatus(e.target.value as typeof tradeStatus)}
          className="rounded-xl border border-monster-border bg-monster-dark px-3 py-2 text-sm text-white"
        >
          {TRADE_LISTING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <Input
        label="What I want in return"
        value={askingFor}
        onChange={(e) => setAskingFor(e.target.value)}
        placeholder="e.g. Other Monster variants, Red Bull editions..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <label className="flex items-center justify-between">
        <span className="text-sm">Shipping available</span>
        <input
          type="checkbox"
          checked={shipping}
          onChange={(e) => setShipping(e.target.checked)}
          className="h-5 w-5 accent-monster-green"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm">Local pickup available</span>
        <input
          type="checkbox"
          checked={localPickup}
          onChange={(e) => setLocalPickup(e.target.checked)}
          className="h-5 w-5 accent-monster-green"
        />
      </label>

      <TradeExtraImages
        userId={can.user_id}
        listingId={listing.id}
        images={listing.extra_image_urls}
        maxImages={premiumFeatures.maxTradeImages}
        disabled={saving}
        onChange={async (urls) => {
          await save({ extra_image_urls: urls })
        }}
      />

      {premiumFeatures.canUseTradeVideo ? (
        <div className="flex flex-col gap-2">
          <Input
            label="YouTube video URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onBlur={handleYoutubeBlur}
            placeholder="https://youtube.com/watch?v=..."
          />
          {youtubeError ? <p className="text-xs text-red-400">{youtubeError}</p> : null}
          {youtubeUrl.trim() && !youtubeError && isValidYouTubeUrl(youtubeUrl) ? (
            <YouTubePreview url={youtubeUrl} title={title} />
          ) : null}
        </div>
      ) : null}

      {premiumFeatures.canUsePriorityTradeBadge ? (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-600/30 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-200">
          <Crown size={14} />
          Priority listing badge (coming soon)
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-monster-green">{message}</p> : null}

      <Button fullWidth loading={saving} onClick={() => void handleSave()}>
        Save trade listing
      </Button>
    </Card>
  )
}
