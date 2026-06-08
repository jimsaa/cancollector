import { getPremiumBadge } from '../../lib/premiumBadges'
import type { Profile, PublicProfile } from '../../types/profile'

interface PremiumBadgeProps {
  profile: Pick<
    Profile | PublicProfile,
    'is_premium' | 'premium_source' | 'premium_expires_at' | 'premium_until' | 'premium_status'
  > | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

export function PremiumBadge({ profile, size = 'md', className = '' }: PremiumBadgeProps) {
  const badge = getPremiumBadge(profile)
  if (!badge) return null

  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-monster-green/30 bg-monster-green/10 px-2.5 py-0.5 font-semibold text-monster-green ${sizeClass} ${className}`}
    >
      <span aria-hidden>{badge.emoji}</span>
      {badge.label}
    </span>
  )
}
