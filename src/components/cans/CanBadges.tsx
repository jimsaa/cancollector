import type { ReactNode } from 'react'
import type { Can } from '../../types/can'
import { OPENING_STATUS_SHORT_LABELS } from '../../types/canCollector'
import { CONDITION_GRADE_LABELS } from '../../types/canCollector'

interface CanBadgesProps {
  can: Can
  className?: string
}

function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'green' | 'blue' | 'purple' | 'muted'
}) {
  const tones = {
    default: 'bg-black/70 text-monster-muted',
    green: 'bg-monster-green/90 text-black',
    blue: 'bg-blue-600/90 text-white',
    purple: 'bg-purple-600/90 text-white',
    muted: 'bg-monster-border/80 text-monster-muted',
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function CanBadges({ can, className = '' }: CanBadgesProps) {
  const openingLabel = OPENING_STATUS_SHORT_LABELS[can.opening_status]
  const openingTone = can.opening_status === 'sealed' ? 'green' : 'muted'

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      <Badge tone={openingTone}>{openingLabel}</Badge>
      {can.available_for_trade ? <Badge tone="blue">Trade</Badge> : null}
      {can.is_public || can.show_on_public_profile ? <Badge tone="purple">Public</Badge> : null}
      {can.quantity > 1 ? <Badge tone="default">Qty ×{can.quantity}</Badge> : null}
      {can.condition_grade !== 'unknown' ? (
        <Badge tone="default">{CONDITION_GRADE_LABELS[can.condition_grade]}</Badge>
      ) : null}
    </div>
  )
}
