import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Crown, Image, Mail, MapPin, Package, Truck } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { YouTubePreview } from '../components/trade/YouTubePreview'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { fetchCanById } from '../lib/cans'
import { fetchTradeListingById } from '../lib/tradeListings'
import type { Can } from '../types/can'
import type { TradeListing } from '../types/trade'

export function TradeListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isPremium, premiumFeatures } = useAuth()
  const [listing, setListing] = useState<TradeListing | null>(null)
  const [can, setCan] = useState<Can | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([fetchTradeListingById(id),])
      .then(async ([data]) => {
        if (!data) {
          setError('Trade listing not found')
          return
        }
        setListing(data)
        const linked = await fetchCanById(data.can_id)
        setCan(linked)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Layout title="Trade Listing" hideNav>
        <LoadingSpinner fullPage label="Loading listing..." />
      </Layout>
    )
  }

  if (error || !listing) {
    return (
      <Layout title="Trade Listing" hideNav>
        <EmptyState title="Listing not found" description={error ?? undefined} />
        <Link to="/trade" className="mt-4 block text-center text-sm text-monster-green">
          Back to Trade
        </Link>
      </Layout>
    )
  }

  const location = [listing.location_city, listing.location_country].filter(Boolean).join(', ')
  const mainImage = can?.image_url
  const allImages = [mainImage, ...listing.extra_image_urls].filter(Boolean) as string[]
  const currentImage = allImages[galleryIndex] ?? null

  return (
    <Layout title="Trade Listing" hideNav>
      <Link
        to="/trade"
        className="mb-4 inline-flex items-center gap-1 text-sm text-monster-muted hover:text-white"
      >
        <ArrowLeft size={16} /> Back to Trade
      </Link>

      <div className="flex flex-col gap-4">
        {premiumFeatures.canUsePriorityTradeBadge && isPremium ? (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-600/30 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-200">
            <Crown size={14} />
            Priority listing (placeholder)
          </div>
        ) : null}

        <div>
          <h1 className="text-xl font-bold text-white">{listing.title}</h1>
          <p className="text-sm text-monster-muted">{listing.product_name ?? can?.name}</p>
        </div>

        <Card className="overflow-hidden p-0">
          {currentImage ? (
            <img src={currentImage} alt="" className="aspect-square w-full object-contain bg-monster-dark p-4" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-monster-dark text-monster-green/30">
              <Package size={48} />
            </div>
          )}
          {allImages.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-monster-border p-2">
              {allImages.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setGalleryIndex(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${
                    galleryIndex === i ? 'border-monster-green' : 'border-monster-border'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-contain p-0.5" />
                </button>
              ))}
            </div>
          ) : null}
        </Card>

        {listing.extra_image_urls.length > 0 ? (
          <p className="flex items-center gap-1 text-xs text-monster-muted">
            <Image size={12} />
            {listing.extra_image_urls.length} extra photo
            {listing.extra_image_urls.length === 1 ? '' : 's'}
          </p>
        ) : null}

        {listing.youtube_url ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">Video</p>
            <YouTubePreview url={listing.youtube_url} title={listing.title} />
          </div>
        ) : null}

        <Card>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-monster-muted">Condition</span>
              <span className="capitalize text-white">{listing.condition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-monster-muted">Status</span>
              <span className="capitalize text-white">{listing.trade_status}</span>
            </div>
            {listing.brand ? (
              <div className="flex justify-between">
                <span className="text-monster-muted">Brand</span>
                <span className="text-white">{listing.brand}</span>
              </div>
            ) : null}
            {listing.flavor ? (
              <div className="flex justify-between">
                <span className="text-monster-muted">Flavor</span>
                <span className="text-white">{listing.flavor}</span>
              </div>
            ) : null}
          </div>
        </Card>

        {listing.description ? (
          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm text-white">{listing.description}</p>
          </Card>
        ) : null}

        {listing.asking_for ? (
          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
              Asking for
            </p>
            <p className="text-sm text-white">{listing.asking_for}</p>
          </Card>
        ) : null}

        <Card>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
            Location & delivery
          </p>
          {location ? (
            <p className="mb-2 flex items-center gap-1 text-sm text-white">
              <MapPin size={14} className="text-monster-green" />
              {location}
            </p>
          ) : (
            <p className="mb-2 text-sm text-monster-muted">Location not specified</p>
          )}
          <div className="flex flex-wrap gap-2">
            {listing.shipping_available ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-monster-green/15 px-2 py-1 text-xs text-monster-green">
                <Truck size={12} /> Shipping available
              </span>
            ) : null}
            {listing.local_pickup_available ? (
              <span className="rounded-lg bg-monster-green/15 px-2 py-1 text-xs text-monster-green">
                Local pickup
              </span>
            ) : null}
          </div>
        </Card>

        <Card>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-monster-muted">
            Collector
          </p>
          <p className="text-sm text-white">Collector (display name coming soon)</p>
        </Card>

        <Button variant="secondary" fullWidth disabled>
          <Mail size={18} />
          Contact collector (coming soon)
        </Button>

        {can ? (
          <Link to={`/can/${can.id}`} className="text-center text-xs text-monster-green hover:underline">
            View can in collection
          </Link>
        ) : null}
      </div>
    </Layout>
  )
}
