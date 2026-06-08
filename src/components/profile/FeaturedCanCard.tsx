import { Star } from 'lucide-react'
import type { Can } from '../../types/can'
import { getCollectionDisplayImageUrl } from '../../lib/canImage'
import { Card } from '../ui/Card'

interface FeaturedCanCardProps {
  can: Can
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  unknown: 'Unknown',
}

export function FeaturedCanCard({ can }: FeaturedCanCardProps) {
  const rarityLabel = RARITY_LABELS[can.rarity] ?? can.rarity

  return (
    <Card className="overflow-hidden border-monster-green/30 bg-monster-green/5 p-0">
      <div className="flex items-center gap-2 border-b border-monster-green/20 px-4 py-2">
        <Star size={16} className="fill-monster-green text-monster-green" />
        <p className="text-sm font-semibold text-white">Featured Can</p>
      </div>
      <div className="flex gap-4 p-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-monster-dark">
          <img
            src={getCollectionDisplayImageUrl(can)}
            alt={can.name ?? 'Featured can'}
            className="h-full w-full object-contain p-2"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{can.name ?? 'Unknown Can'}</p>
          {can.country ? (
            <p className="mt-1 text-sm text-monster-muted">{can.country}</p>
          ) : null}
          {can.rarity !== 'unknown' ? (
            <span className="mt-2 inline-block rounded-full bg-monster-green/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-monster-green">
              {rarityLabel}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
