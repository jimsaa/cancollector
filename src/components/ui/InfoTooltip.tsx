import { Info } from 'lucide-react'

interface InfoTooltipProps {
  text: string
  className?: string
}

export function InfoTooltip({ text, className = '' }: InfoTooltipProps) {
  return (
    <span
      className={`inline-flex cursor-help text-monster-muted transition-colors hover:text-monster-green ${className}`}
      title={text}
      aria-label={text}
      role="tooltip"
    >
      <Info size={15} strokeWidth={2} />
    </span>
  )
}
