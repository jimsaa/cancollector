import { Link } from 'react-router-dom'
import { Target } from 'lucide-react'
import type { CollectionProgress } from '../../types/masterCan'
import { formatProgressLabel, formatProgressPercent } from '../../lib/collectionProgress'
import { Card } from '../ui/Card'

interface CollectionProgressCardProps {
  progress: CollectionProgress
  showLink?: boolean
}

export function CollectionProgressCard({ progress, showLink = true }: CollectionProgressCardProps) {
  const barWidth = progress.total === 0 ? 0 : Math.min(100, progress.percentage)

  const content = (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-monster-green" />
          <p className="text-sm font-semibold text-white">Collection Progress</p>
        </div>
        <p className="text-xs font-semibold text-monster-green">{formatProgressPercent(progress)}</p>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-monster-muted">Owned</p>
          <p className="text-2xl font-bold text-white">{progress.owned}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-monster-muted">Master Database</p>
          <p className="text-2xl font-bold text-white">{progress.total}</p>
        </div>
      </div>

      <p className="mb-2 text-sm text-monster-muted">
        <span className="font-semibold text-white">{formatProgressLabel(progress)}</span>
        {' · '}
        {formatProgressPercent(progress)}
      </p>

      <div className="h-2 overflow-hidden rounded-full bg-monster-border">
        <div
          className="h-full rounded-full bg-monster-green transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-monster-muted">
        Master Database Coverage: {progress.total.toLocaleString()} verified{' '}
        {progress.total === 1 ? 'can' : 'cans'}
        {progress.missing > 0 ? ` · ${progress.missing} missing from your collection` : ''}
      </p>
    </Card>
  )

  if (!showLink) return content

  return (
    <Link to="/missing" className="block transition-opacity hover:opacity-90">
      {content}
    </Link>
  )
}
