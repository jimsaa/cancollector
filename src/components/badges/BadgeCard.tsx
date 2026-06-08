import type { Badge, BadgeTier } from '../../types/badge'

const TIER_STYLES: Record<BadgeTier, string> = {
  bronze: 'border-amber-700/50 bg-amber-950/30 shadow-[0_0_12px_rgba(180,83,9,0.15)]',
  silver: 'border-slate-400/40 bg-slate-900/40 shadow-[0_0_12px_rgba(148,163,184,0.12)]',
  gold: 'border-yellow-500/50 bg-yellow-950/25 shadow-[0_0_16px_rgba(234,179,8,0.2)]',
  platinum: 'border-cyan-400/40 bg-cyan-950/20 shadow-[0_0_18px_rgba(34,211,238,0.18)]',
  special: 'border-monster-green/60 bg-monster-green/10 shadow-[0_0_20px_rgba(141,198,63,0.25)]',
}

interface BadgeCardProps {
  badge: Pick<Badge, 'id' | 'name' | 'description' | 'emoji' | 'tier' | 'category'>
  earned?: boolean
  featured?: boolean
  compact?: boolean
  onClick?: () => void
}

export function BadgeCard({ badge, earned = true, featured, compact, onClick }: BadgeCardProps) {
  const tierClass = TIER_STYLES[badge.tier] ?? TIER_STYLES.bronze
  const opacity = earned ? '' : 'opacity-35 grayscale'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group relative flex flex-col items-center rounded-2xl border p-3 text-center transition-transform ${tierClass} ${opacity} ${
        featured ? 'ring-2 ring-monster-green ring-offset-2 ring-offset-monster-black' : ''
      } ${onClick ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'} ${compact ? 'p-2' : ''}`}
    >
      <span className={`${compact ? 'text-2xl' : 'text-3xl'}`} aria-hidden>
        {badge.emoji}
      </span>
      <p className={`mt-1 font-semibold text-white ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {badge.name}
      </p>
      {!compact ? (
        <p className="mt-0.5 line-clamp-2 text-[10px] text-monster-muted">{badge.description}</p>
      ) : null}
      {featured ? (
        <span className="absolute -top-2 right-2 rounded-full bg-monster-green px-1.5 py-0.5 text-[8px] font-bold uppercase text-black">
          Featured
        </span>
      ) : null}
    </button>
  )
}
