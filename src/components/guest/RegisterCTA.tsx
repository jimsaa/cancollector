import { Link } from 'react-router-dom'
import { Cloud, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface RegisterCTAProps {
  onDismiss: () => void
  onLearnMore?: () => void
  canRegister: boolean
}

export function RegisterCTA({ onDismiss, onLearnMore, canRegister }: RegisterCTAProps) {
  return (
    <Card className="relative border-monster-green/30 bg-monster-green/5 p-4">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 text-monster-muted hover:text-white"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <Cloud size={20} className="mt-0.5 shrink-0 text-monster-green" />
        <div>
          <p className="text-sm font-semibold text-white">
            Protect your collection. Create a free account and sync your cans online.
          </p>
          <p className="mt-1 text-xs text-monster-muted">
            Free registration — no payment required. Premium features are optional.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/register">
              <Button className="py-2 text-xs">
                {canRegister ? 'Create Free Account' : 'Set Up Cloud Account'}
              </Button>
            </Link>
            {onLearnMore ? (
              <Button variant="secondary" className="py-2 text-xs" onClick={onLearnMore}>
                Learn More
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
