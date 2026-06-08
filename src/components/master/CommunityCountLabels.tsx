import type { MasterCanCommunityCounts } from '../../types/masterCan'

interface CommunityCountLabelsProps {
  counts: MasterCanCommunityCounts
  compact?: boolean
}

function formatCount(n: number, noun: string): string {
  return `${n} collector${n === 1 ? '' : 's'} ${noun} this`
}

export function CommunityCountLabels({ counts, compact }: CommunityCountLabelsProps) {
  const items = [
    counts.got > 0 ? formatCount(counts.got, 'own') : null,
    counts.want > 0 ? formatCount(counts.want, 'want') : null,
    counts.need > 0 ? formatCount(counts.need, 'need') : null,
  ].filter(Boolean) as string[]

  if (items.length === 0) {
    return (
      <p className={`text-monster-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>
        No collector marks yet
      </p>
    )
  }

  return (
    <p className={`text-monster-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {items.join(' · ')}
    </p>
  )
}
