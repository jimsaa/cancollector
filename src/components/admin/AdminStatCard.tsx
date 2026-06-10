import type { ReactNode } from 'react'

interface AdminStatCardProps {
  label: string
  value: number | string
  hint?: string
  icon?: ReactNode
}

export function AdminStatCard({ label, value, hint, icon }: AdminStatCardProps) {
  return (
    <div className="rounded-xl border border-monster-border bg-monster-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-monster-muted">{label}</p>
        {icon ? <span className="text-monster-green">{icon}</span> : null}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-monster-muted">{hint}</p> : null}
    </div>
  )
}
