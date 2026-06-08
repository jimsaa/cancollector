import { Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDashboardPremiumLabel } from '../../lib/premiumBadges'
import { isPremiumActive } from '../../lib/premium'
import type { Profile } from '../../types/profile'
import { Card } from '../ui/Card'
import { PremiumBadge } from './PremiumBadge'

interface PremiumStatusCardProps {
  profile: Profile | null | undefined
}

export function PremiumStatusCard({ profile }: PremiumStatusCardProps) {
  const isPremium = isPremiumActive(profile ?? null)
  const label = getDashboardPremiumLabel(profile ?? null)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-monster-muted">Premium Status</p>
          <p className="mt-1 text-lg font-semibold text-white">{label}</p>
          {isPremium && profile?.premium_expires_at ? (
            <p className="mt-0.5 text-xs text-monster-muted">
              Until {new Date(profile.premium_expires_at).toLocaleDateString()}
            </p>
          ) : isPremium ? (
            <p className="mt-0.5 text-xs text-monster-green">Lifetime access</p>
          ) : (
            <Link to="/premium" className="mt-1 inline-block text-xs text-monster-green hover:underline">
              Learn about premium →
            </Link>
          )}
        </div>
        {isPremium ? (
          <PremiumBadge profile={profile} />
        ) : (
          <Crown size={22} className="shrink-0 text-monster-muted/50" />
        )}
      </div>
    </Card>
  )
}
