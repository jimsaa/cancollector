import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

interface StatTileProps {
  label: string
  value: string | number
  icon?: ReactNode
  subtext?: string
  className?: string
}

export function StatTile({ label, value, icon, subtext, className = '' }: StatTileProps) {
  return (
    <Card className={`flex flex-col gap-1.5 p-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-monster-muted">
          {label}
        </span>
        {icon ? <span className="text-monster-green">{icon}</span> : null}
      </div>
      <p className="text-2xl font-bold leading-none text-white">{value}</p>
      {subtext ? <p className="text-[10px] text-monster-muted">{subtext}</p> : null}
    </Card>
  )
}
