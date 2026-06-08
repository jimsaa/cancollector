import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Medal, Trophy } from 'lucide-react'
import { BadgeCard } from '../components/badges/BadgeCard'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { getBadgeFromCatalog } from '../lib/badges'
import { fetchLeaderboardWithSync } from '../lib/leaderboard'
import { LEADERBOARD_LABELS, type LeaderboardEntry, type LeaderboardMetric } from '../types/badge'

const METRICS: LeaderboardMetric[] = ['cans', 'completion', 'badges', 'trades', 'contributions']

function formatScore(metric: LeaderboardMetric, score: number): string {
  if (metric === 'completion') return `${Math.round(score)}%`
  return String(Math.round(score))
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="w-6 text-center text-sm font-bold text-monster-muted">#{rank}</span>
}

export function LeaderboardPage() {
  const [metric, setMetric] = useState<LeaderboardMetric>('cans')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void fetchLeaderboardWithSync(metric, 50)
      .then((rows) => {
        if (active) setEntries(rows.filter((r) => r.score > 0 || metric === 'completion'))
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [metric])

  return (
    <Layout title="Leaderboard">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Public collectors only. Enable your public profile in settings to appear here.
        </p>

        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                metric === m
                  ? 'border-monster-green bg-monster-green/20 text-monster-green'
                  : 'border-monster-border text-monster-muted hover:text-white'
              }`}
            >
              {LEADERBOARD_LABELS[m]}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading leaderboard..." />
        ) : error ? (
          <EmptyState title="Could not load" description={error} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Trophy size={40} />}
            title="No rankings yet"
            description="Public collectors will appear here as the community grows."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const name = entry.public_display_name || entry.username
              const featuredBadge = entry.featured_badge_id
                ? getBadgeFromCatalog(entry.featured_badge_id)
                : null

              return (
                <Card key={entry.user_id} className="flex items-center gap-3 p-3">
                  <RankMedal rank={entry.rank} />
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-monster-green/20">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-bold text-monster-green">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/u/${entry.username}`}
                      className="truncate font-semibold text-white hover:text-monster-green"
                    >
                      {name}
                    </Link>
                    <p className="text-xs text-monster-muted">@{entry.username}</p>
                  </div>
                  {featuredBadge ? (
                    <div className="hidden sm:block">
                      <BadgeCard badge={featuredBadge} compact earned />
                    </div>
                  ) : null}
                  <div className="text-right">
                    <p className="text-lg font-bold text-monster-green">
                      {formatScore(metric, entry.score)}
                    </p>
                    <p className="text-[10px] uppercase text-monster-muted">
                      <Medal size={10} className="mr-0.5 inline" />
                      {LEADERBOARD_LABELS[metric]}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
