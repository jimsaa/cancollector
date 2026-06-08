import type { Can } from '../../types/can'
import { getCollectionDisplayImageUrl } from '../../lib/canImage'
import { CanBadges } from '../cans/CanBadges'
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
        <div className="absolute left-2 right-2 top-2">
          <CanBadges can={can} />
        </div>
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-semibold text-white">{can.name ?? 'Unknown Can'}</p>
        {can.country ? <p className="truncate text-[10px] text-monster-muted">{can.country}</p> : null}
      </div>
    </Card>
  )
}
