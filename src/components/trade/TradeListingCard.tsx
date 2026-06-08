import { Link } from 'react-router-dom'
import { Image, MapPin, Package, Truck, Video } from 'lucide-react'
import type { Can } from '../../types/can'
import { formatTradePrice } from '../../lib/canCollectorFields'
import { getTradeDisplayImageUrl } from '../../lib/canImage'
import {
  CONDITION_GRADE_LABELS,
  OPENING_STATUS_LABELS,
} from '../../types/canCollector'
import type { TradeListing } from '../../types/trade'
import { Card } from '../ui/Card'

interface TradeListingCardProps {
  listing: TradeListing
  can?: Can | null
  showPriority?: boolean
}

export function TradeListingCard({ listing, can, showPriority }: TradeListingCardProps) {
  const imageUrl = can ? getTradeDisplayImageUrl(can) : null
  const location = [listing.location_city, listing.location_country].filter(Boolean).join(', ')
  const extraCount = listing.extra_image_urls.length
  const tradePrice = can ? formatTradePrice(can.trade_price, can.trade_currency) : null
  const openingLabel = can ? OPENING_STATUS_LABELS[can.opening_status] : null
  const conditionLabel = can ? CONDITION_GRADE_LABELS[can.condition_grade] : listing.condition

  return (
    <Link to={`/trade/listing/${listing.id}`}>
      <Card className="flex gap-3 p-3 transition-colors hover:border-monster-green/40">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-monster-dark">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <div className="flex h-full items-center justify-center text-lg font-black text-monster-green/30">
              <Package size={24} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-white">{listing.title}</p>
            {showPriority ? (
              <span className="shrink-0 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
                PRIORITY
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-monster-muted">
            {listing.product_name ?? can?.name ?? 'Unknown can'}
          </p>
          <p className="mt-1 text-[10px] capitalize text-blue-400">
            {conditionLabel} · {listing.trade_status}
          </p>
          {openingLabel ? (
            <p className="mt-0.5 text-[10px] text-monster-muted">{openingLabel}</p>
          ) : null}
          {can && can.quantity > 1 ? (
            <p className="mt-0.5 text-[10px] text-monster-green">Qty available: ×{can.quantity}</p>
          ) : null}
          {tradePrice ? (
            <p className="mt-0.5 text-[10px] font-semibold text-white">Asking: {tradePrice}</p>
          ) : null}
          {can?.trade_note ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] text-monster-muted">{can.trade_note}</p>
          ) : null}
          {location ? (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-monster-muted">
              <MapPin size={10} />
              {location}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {listing.shipping_available ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-monster-green/15 px-1.5 py-0.5 text-[9px] text-monster-green">
                <Truck size={9} /> Ships
              </span>
            ) : null}
            {listing.local_pickup_available ? (
              <span className="rounded bg-monster-green/15 px-1.5 py-0.5 text-[9px] text-monster-green">
                Pickup
              </span>
            ) : null}
            {extraCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-monster-border/50 px-1.5 py-0.5 text-[9px] text-monster-muted">
                <Image size={9} /> +{extraCount}
              </span>
            ) : null}
            {listing.youtube_url ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-red-900/30 px-1.5 py-0.5 text-[9px] text-red-300">
                <Video size={9} /> Video
              </span>
            ) : null}
          </div>
          {listing.asking_for ? (
            <p className="mt-1.5 line-clamp-2 text-[10px] text-monster-muted">
              Wants: {listing.asking_for}
            </p>
          ) : null}
        </div>
      </Card>
    </Link>
  )
}
