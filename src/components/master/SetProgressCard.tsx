import { Link } from 'react-router-dom'
import type { CollectionSetProgress } from '../../types/collectionSet'
import { Card } from '../ui/Card'

interface SetProgressCardProps {
  progress: CollectionSetProgress
  linkToMissing?: boolean
}

export function SetProgressCard({ progress, linkToMissing = true }: SetProgressCardProps) {
  const barWidth = progress.total === 0 ? 0 : Math.min(100, progress.percentage)

  const content = (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-semibold text-white">{progress.set} Collection</p>
        <p className="text-xs font-semibold text-monster-green">{progress.percentage}%</p>
      </div>
      <p className="text-sm text-monster-muted">
        <span className="font-semibold text-white">
          {progress.owned} / {progress.total}
        </span>{' '}
        collected
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-monster-border">
        <div
          className="h-full rounded-full bg-monster-green transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      {progress.missing > 0 ? (
        <p className="mt-2 text-xs text-monster-muted">{progress.missing} missing</p>
      ) : (
        <p className="mt-2 text-xs text-monster-green">Complete!</p>
      )}
    </Card>
  )

  if (!linkToMissing) return content

  return (
    <Link to={`/missing?set=${encodeURIComponent(progress.set)}`} className="block hover:opacity-90">
      {content}
    </Link>
  )
}
