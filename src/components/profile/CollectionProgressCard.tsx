import { Database } from 'lucide-react'
import { formatCompletionPercent } from '../../lib/collectorRank'
import type { PublicProfileStats } from '../../types/profile'
import { Card } from '../ui/Card'

interface CollectionProgressCardProps {
  stats: PublicProfileStats
}

export function CollectionProgressCard({ stats }: CollectionProgressCardProps) {
  const pct = Math.min(100, Math.max(0, stats.completionPercentage))
  const barWidth = pct > 0 ? Math.max(pct, 4) : 0

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">Collection Progress</p>
        <Database size={16} className="shrink-0 text-monster-green" />
      </div>

      <p className="mt-2 text-2xl font-bold text-white">
        {stats.completionOwned} / {stats.completionTotal} collected
      </p>
      <p className="text-sm text-monster-muted">
        {formatCompletionPercent(pct)} complete
      </p>

      <div className="relative mt-4 h-8 overflow-hidden rounded-full bg-monster-dark">
        <div
          className="h-full rounded-full bg-gradient-to-r from-monster-green/80 to-monster-green transition-all"
          style={{ width: `${barWidth}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
          {formatCompletionPercent(pct)}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-monster-border bg-monster-dark/60 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-monster-muted">
          Master Database Coverage
        </p>
        <p className="mt-0.5 text-sm text-white">
          <span className="font-semibold text-monster-green">{stats.completionOwned}</span>
          {' verified '}
          {stats.completionOwned === 1 ? 'can' : 'cans'}
          {' · '}
          {stats.completionTotal} master entries
        </p>
      </div>
    </Card>
  )
}
