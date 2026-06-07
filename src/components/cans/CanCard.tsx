import { Link } from 'react-router-dom'
import type { Can } from '../../types/can'
import { Card } from '../ui/Card'

interface CanCardProps {
  can: Can
  compact?: boolean
}

const rarityColors: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-blue-400',
  rare: 'text-yellow-400',
  unknown: 'text-monster-muted',
}

export function CanCard({ can, compact }: CanCardProps) {
  return (
    <Link to={`/can/${can.id}`} className="block">
      <Card className="overflow-hidden p-0">
        <div className={`relative bg-monster-dark ${compact ? 'aspect-square' : 'aspect-[3/4]'}`}>
          {can.image_url ? (
            <img
              src={can.image_url}
              alt={can.name ?? 'Can'}
              className="h-full w-full object-contain p-2"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl font-black text-monster-green/20">M</span>
            </div>
          )}
          {can.quantity > 1 ? (
            <span className="absolute right-2 top-2 rounded-full bg-monster-green px-2 py-0.5 text-xs font-bold text-black">
              ×{can.quantity}
            </span>
          ) : null}
          {can.opened ? (
            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] uppercase text-monster-muted">
              Opened
            </span>
          ) : null}
          {can.available_for_trade ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-monster-green/90 px-2 py-0.5 text-[10px] font-semibold text-black">
              Trade
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold text-white">{can.name ?? 'Unknown Can'}</p>
          {!compact && can.flavor ? (
            <p className="truncate text-xs text-monster-muted">{can.flavor}</p>
          ) : null}
          <div className="mt-1 flex items-center justify-between">
            {can.volume ? <span className="text-[10px] text-monster-muted">{can.volume}</span> : <span />}
            <span className={`text-[10px] capitalize ${rarityColors[can.rarity]}`}>{can.rarity}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
