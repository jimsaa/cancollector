type VerificationBadgeKind = 'master_verified' | 'lookup_only'

const styles: Record<VerificationBadgeKind, string> = {
  master_verified: 'bg-monster-green/20 text-monster-green border-monster-green/40',
  lookup_only: 'bg-yellow-900/30 text-yellow-300 border-yellow-600/40',
}

const labels: Record<VerificationBadgeKind, string> = {
  master_verified: 'Master Verified',
  lookup_only: 'Lookup Only',
}

interface VerificationBadgeProps {
  kind: VerificationBadgeKind
  className?: string
}

export function VerificationBadge({ kind, className = '' }: VerificationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[kind]} ${className}`}
    >
      {labels[kind]}
    </span>
  )
}
