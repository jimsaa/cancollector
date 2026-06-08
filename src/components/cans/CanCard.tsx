import { Link } from 'react-router-dom'
import type { Can } from '../../types/can'
import { getCollectionDisplayImageUrl } from '../../lib/canImage'
import { CanBadges } from './CanBadges'
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
  const countryLabel = [can.country, can.country_variant].filter(Boolean).join(' · ')

  return (
    <Link to={`/can/${can.id}`} className="block">
      <Card className="overflow-hidden p-0">
        <div className={`relative bg-monster-dark ${compact ? 'aspect-square' : 'aspect-[3/4]'}`}>
          <img
            src={getCollectionDisplayImageUrl(can)}
            alt={can.name ?? 'Can'}
            className="h-full w-full object-contain p-2"
            loading="lazy"
          />
          <div className="absolute left-2 right-2 top-2">
            <CanBadges can={can} />
          </div>
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold text-white">{can.name ?? 'Unknown Can'}</p>
          {!compact && can.flavor ? (
            <p className="truncate text-xs text-monster-muted">{can.flavor}</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {countryLabel ? (
              <span className="rounded bg-monster-dark px-1.5 py-0.5 text-[10px] text-monster-green">
                {countryLabel}
              </span>
            ) : null}
            {can.volume ? (
              <span className="text-[10px] text-monster-muted">{can.volume}</span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span
              className={`text-[10px] ${can.available_for_trade ? 'text-blue-400' : 'text-monster-muted'}`}
            >
              {can.available_for_trade ? 'For trade' : 'Not for trade'}
            </span>
            <span className={`text-[10px] capitalize ${rarityColors[can.rarity]}`}>{can.rarity}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
