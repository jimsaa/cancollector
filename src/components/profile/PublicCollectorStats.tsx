import {
  ArrowLeftRight,
  Copy,
  Globe2,
  Heart,
  Layers,
  ListMinus,
  Sparkles,
  Tag,
  Target,
} from 'lucide-react'
import type { PublicProfileStats } from '../../types/profile'
import { Card } from '../ui/Card'

interface PublicCollectorStatsProps {
  stats: PublicProfileStats
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2 text-monster-muted">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

export function PublicCollectorStats({ stats }: PublicCollectorStatsProps) {
  return (
    <Card className="p-4">
      <p className="mb-1 text-sm font-semibold text-white">Collector Statistics</p>
      <p className="mb-3 text-xs text-monster-muted">Your collection at a glance</p>

      <div className="divide-y divide-monster-border">
        <StatRow icon={<Layers size={16} />} label="Total Cans" value={stats.totalCans} />
        <StatRow
          icon={<Globe2 size={16} />}
          label="Countries Represented"
          value={stats.countriesRepresented}
        />
        <StatRow icon={<Tag size={16} />} label="Brands Collected" value={stats.brandsCollected} />
        <StatRow icon={<Copy size={16} />} label="Duplicates" value={stats.duplicates} />
        <StatRow icon={<Sparkles size={16} />} label="Rare Cans" value={stats.rareCans} />
        <StatRow
          icon={<ArrowLeftRight size={16} />}
          label="Trade Listings"
          value={`${stats.activeTradeListings} Active`}
        />
        <StatRow icon={<Heart size={16} />} label="Wishlist Items" value={stats.wishlistCount} />
        <StatRow icon={<ListMinus size={16} />} label="Missing from Master DB" value={stats.missingCount} />
        <StatRow icon={<Target size={16} />} label="Needed to Complete" value={stats.needCount} />
        <StatRow icon={<Heart size={16} />} label="Wanted" value={stats.wantCount} />
      </div>
    </Card>
  )
}
