export interface CollectorRank {
  id: string
  title: string
  minPercent: number
  maxPercent: number
}

export const COLLECTOR_RANKS: CollectorRank[] = [
  { id: 'beginner', title: 'Beginner Collector', minPercent: 0, maxPercent: 10 },
  { id: 'explorer', title: 'Explorer Collector', minPercent: 10, maxPercent: 25 },
  { id: 'enthusiast', title: 'Enthusiast Collector', minPercent: 25, maxPercent: 50 },
  { id: 'expert', title: 'Expert Collector', minPercent: 50, maxPercent: 75 },
  { id: 'master', title: 'Master Collector', minPercent: 75, maxPercent: 95 },
  { id: 'legend', title: 'Legend Collector', minPercent: 95, maxPercent: 100 },
]

export interface CollectorRankInfo {
  rank: CollectorRank
  nextRank: CollectorRank | null
  progressToNextPercent: number | null
}

export function getCollectorRank(completionPercent: number): CollectorRankInfo {
  const pct = Math.min(100, Math.max(0, completionPercent))

  let rank = COLLECTOR_RANKS[0]
  for (const candidate of COLLECTOR_RANKS) {
    if (pct >= candidate.minPercent && pct < candidate.maxPercent) {
      rank = candidate
      break
    }
    if (pct >= candidate.maxPercent) rank = candidate
  }

  if (pct >= 100) {
    return {
      rank: COLLECTOR_RANKS[COLLECTOR_RANKS.length - 1],
      nextRank: null,
      progressToNextPercent: null,
    }
  }

  const index = COLLECTOR_RANKS.findIndex((r) => r.id === rank.id)
  const nextRank = index >= 0 && index < COLLECTOR_RANKS.length - 1 ? COLLECTOR_RANKS[index + 1] : null

  if (!nextRank) {
    return { rank, nextRank: null, progressToNextPercent: null }
  }

  const span = nextRank.minPercent - rank.minPercent
  const progress = span > 0 ? ((pct - rank.minPercent) / span) * 100 : 0

  return {
    rank,
    nextRank,
    progressToNextPercent: Math.min(100, Math.max(0, progress)),
  }
}

export function formatCompletionPercent(value: number): string {
  if (value >= 100) return '100%'
  if (value >= 10) return `${value.toFixed(1)}%`
  return `${value.toFixed(1)}%`
}
