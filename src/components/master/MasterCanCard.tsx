import { Heart, Check } from 'lucide-react'
import type { MasterCanWithStatus } from '../../types/masterCan'
import {
  getMasterReferenceDisplayUrl,
  getMasterReferenceImageUrl,
} from '../../lib/masterReferenceImage'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface MasterCanCardProps {
  can: MasterCanWithStatus
  onToggleWant?: (can: MasterCanWithStatus) => void
  wantLoading?: boolean
  showOwnedBadge?: boolean
}

const rarityColors: Record<string, string> = {
  common: 'text-monster-muted',
  uncommon: 'text-blue-400',
  rare: 'text-yellow-400',
  unknown: 'text-monster-muted',
}

export function MasterCanCard({
  can,
  onToggleWant,
  wantLoading,
  showOwnedBadge = true,
}: MasterCanCardProps) {
  return (
    <Card className="flex gap-3 p-3">
      <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-monster-card">
        {getMasterReferenceImageUrl(can) ? (
          <img
            src={getMasterReferenceDisplayUrl(can)}
            alt=""
            className="h-full w-full object-contain p-0.5"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[10px] font-bold uppercase text-monster-muted">{can.brand[0]}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{can.product_name}</p>
            <p className="text-xs text-monster-muted">
              {[can.brand, can.flavor, can.variant_name, can.volume, can.country]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          {showOwnedBadge && can.owned ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-monster-green/20 px-2 py-0.5 text-[10px] font-semibold text-monster-green">
              <Check size={12} />
              Owned
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className={`text-[10px] uppercase tracking-wide ${rarityColors[can.rarity]}`}>
            {can.rarity}
            {can.discontinued ? ' · discontinued' : ''}
          </span>

          {!can.owned && onToggleWant ? (
            <Button
              type="button"
              variant={can.wanted ? 'secondary' : 'ghost'}
              className="py-1.5 text-xs"
              loading={wantLoading}
              onClick={() => onToggleWant(can)}
            >
              <Heart size={14} className={can.wanted ? 'fill-monster-green text-monster-green' : ''} />
              {can.wanted ? 'Wanted' : 'Want'}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
