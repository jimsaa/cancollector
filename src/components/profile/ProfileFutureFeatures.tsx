import { Award, Crown, Image, Palette } from 'lucide-react'
import type { PremiumFeatures } from '../../lib/premium'
import { Card } from '../ui/Card'

interface ProfileFutureFeaturesProps {
  premiumFeatures: PremiumFeatures
  isPremium: boolean
}

const FEATURES = [
  {
    key: 'verified',
    icon: Award,
    label: 'Verified Collector badge',
    enabled: (f: PremiumFeatures) => f.canUseVerifiedCollectorBadge,
  },
  {
    key: 'theme',
    icon: Palette,
    label: 'Premium profile themes',
    enabled: (f: PremiumFeatures) => f.canUseCustomProfileTheme,
  },
  {
    key: 'gallery',
    icon: Image,
    label: 'Showcase gallery',
    enabled: (f: PremiumFeatures) => f.canUseFeaturedCans,
  },
  {
    key: 'achievements',
    icon: Crown,
    label: 'Achievement system',
    enabled: () => false,
  },
] as const

export function ProfileFutureFeatures({ premiumFeatures, isPremium }: ProfileFutureFeaturesProps) {
  return (
    <Card className="border-monster-border/80 bg-monster-dark/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Crown size={16} className="text-yellow-400" />
        <p className="text-sm font-semibold text-white">Coming soon</p>
      </div>
      <p className="mb-3 text-xs text-monster-muted">
        Profile upgrades prepared for verified collectors, premium themes, and achievements.
      </p>
      <ul className="space-y-2">
        {FEATURES.map(({ key, icon: Icon, label, enabled }) => {
          const active = enabled(premiumFeatures)
          return (
            <li
              key={key}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                active ? 'bg-monster-green/10 text-monster-green' : 'bg-monster-black/40 text-monster-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={14} />
                {label}
              </span>
              <span className="font-semibold uppercase tracking-wide">
                {active && isPremium ? 'Ready' : 'Soon'}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
