import { Award, ChevronRight } from 'lucide-react'
import { getCollectorRank } from '../../lib/collectorRank'
import { Card } from '../ui/Card'

interface CollectorRankBadgeProps {
  completionPercent: number
}

const RANK_COLORS: Record<string, string> = {
  beginner: 'from-zinc-600/40 to-zinc-700/20 border-zinc-500/30',
  explorer: 'from-emerald-900/40 to-emerald-800/20 border-emerald-600/30',
  enthusiast: 'from-green-900/40 to-green-800/20 border-monster-green/30',
  expert: 'from-lime-900/40 to-lime-800/20 border-lime-500/30',
  master: 'from-yellow-900/40 to-yellow-800/20 border-yellow-500/40',
  legend: 'from-amber-600/40 to-orange-700/20 border-amber-400/50',
}

export function CollectorRankBadge({ completionPercent }: CollectorRankBadgeProps) {
  const { rank, nextRank, progressToNextPercent } = getCollectorRank(completionPercent)
  const colorClass = RANK_COLORS[rank.id] ?? RANK_COLORS.beginner

  return (
    <Card className={`border bg-gradient-to-br p-4 ${colorClass}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-monster-green/20">
          <Award size={22} className="text-monster-green" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-monster-muted">
            Collector Rank
          </p>
          <p className="mt-0.5 text-lg font-bold text-white">{rank.title}</p>
          {nextRank && progressToNextPercent !== null ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-monster-muted">
                <span>Progress to {nextRank.title}</span>
                <span>{Math.round(progressToNextPercent)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-monster-dark">
                <div
                  className="h-full rounded-full bg-monster-green"
                  style={{ width: `${progressToNextPercent}%` }}
                />
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-monster-muted">
                <ChevronRight size={10} />
                Next rank at {nextRank.minPercent}%
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-monster-green">Max rank achieved</p>
          )}
        </div>
      </div>
    </Card>
  )
}
