import { getMasterReferenceDisplayUrl } from '../../lib/masterReferenceImage'
import type { MasterCanProductMatch } from '../../lib/masterCanProductMatch'
import { Button } from '../ui/Button'

interface PossibleMatchCardProps {
  match: MasterCanProductMatch
  onSelect: () => void
  onReport?: () => void
  reporting?: boolean
}

export function PossibleMatchCard({ match, onSelect, onReport, reporting }: PossibleMatchCardProps) {
  const { master, score } = match
  const imageUrl = getMasterReferenceDisplayUrl(master)

  return (
    <div className="rounded-xl border border-monster-border bg-monster-dark p-3">
      <div className="flex gap-3">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-monster-black">
          <img src={imageUrl} alt="" className="h-full w-full object-contain p-1" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{master.product_name}</p>
          {master.flavor ? <p className="text-xs text-monster-muted">{master.flavor}</p> : null}
          <p className="mt-1 text-xs text-monster-muted">
            {master.brand}
            {master.country ? ` · ${master.country}` : ''}
          </p>
          <p className="mt-1 font-mono text-[10px] text-monster-green">
            {master.barcode ?? 'No barcode yet'}
          </p>
          <p className="text-[10px] text-yellow-200/80">{Math.round(score * 100)}% similarity — not verified</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button className="py-2 text-xs" onClick={onSelect}>
          Select this can
        </Button>
        {onReport ? (
          <Button variant="secondary" className="py-2 text-xs" loading={reporting} onClick={onReport}>
            Report incorrect match
          </Button>
        ) : null}
      </div>
    </div>
  )
}
