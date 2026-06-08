import type { BadgeWithEarned } from '../../types/badge'
import { BadgeCard } from './BadgeCard'

interface BadgeShowcaseProps {
  badges: BadgeWithEarned[]
  featuredBadgeId?: string | null
  showCount?: boolean
}

export function BadgeShowcase({ badges, featuredBadgeId, showCount = true }: BadgeShowcaseProps) {
  const featured = badges.find((b) => b.id === featuredBadgeId) ?? badges[0]

  if (badges.length === 0) {
    return (
      <p className="text-sm text-monster-muted">No badges earned yet. Keep collecting to unlock achievements.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {showCount ? (
        <p className="text-sm text-monster-muted">
          <span className="font-semibold text-monster-green">{badges.length}</span> badge
          {badges.length === 1 ? '' : 's'} earned
        </p>
      ) : null}

      {featured ? (
        <div className="flex justify-center">
          <BadgeCard badge={featured} featured earned />
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {badges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            compact
            featured={badge.id === featuredBadgeId}
            earned
          />
        ))}
      </div>
    </div>
  )
}
