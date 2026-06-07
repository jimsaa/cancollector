import type { Can } from '../../types/can'
import { getCollectionDisplayImageUrl } from '../../lib/canImage'
import { Card } from '../ui/Card'

interface PublicCanCardProps {
  can: Can
}

export function PublicCanCard({ can }: PublicCanCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-square bg-monster-dark">
        <img
          src={getCollectionDisplayImageUrl(can)}
          alt={can.name ?? 'Can'}
          className="h-full w-full object-contain p-2"
          loading="lazy"
        />
        <span className="absolute right-2 top-2 rounded-full bg-monster-green px-2 py-0.5 text-xs font-bold text-black">
          ×{can.quantity}
        </span>
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
            can.opened ? 'bg-black/70 text-monster-muted' : 'bg-monster-green/90 text-black'
          }`}
        >
          {can.opened ? 'Opened' : 'Sealed'}
        </span>
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-semibold text-white">{can.name ?? 'Unknown Can'}</p>
        {can.country ? <p className="truncate text-[10px] text-monster-muted">{can.country}</p> : null}
      </div>
    </Card>
  )
}
