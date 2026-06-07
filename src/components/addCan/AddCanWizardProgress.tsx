import { Check } from 'lucide-react'

export type AddCanWizardStep = 'scan' | 'match' | 'edit' | 'summary'

const STEPS: { id: AddCanWizardStep; label: string }[] = [
  { id: 'scan', label: 'Scan' },
  { id: 'match', label: 'Match' },
  { id: 'edit', label: 'Review' },
  { id: 'summary', label: 'Save' },
]

interface AddCanWizardProgressProps {
  current: AddCanWizardStep
}

function stepIndex(step: AddCanWizardStep): number {
  return STEPS.findIndex((s) => s.id === step)
}

export function AddCanWizardProgress({ current }: AddCanWizardProgressProps) {
  const currentIdx = stepIndex(current)

  return (
    <nav aria-label="Add can progress" className="mb-2">
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((step, index) => {
          const done = index < currentIdx
          const active = index === currentIdx

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    active
                      ? 'border-monster-green bg-monster-green text-black'
                      : done
                        ? 'border-monster-green bg-monster-green/20 text-monster-green'
                        : 'border-monster-border bg-monster-dark text-monster-muted'
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : index + 1}
                </div>
                <span
                  className={`w-full truncate text-center text-[10px] font-medium ${
                    active ? 'text-monster-green' : done ? 'text-white' : 'text-monster-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={`mx-0.5 mb-4 h-0.5 min-w-[8px] flex-1 rounded ${
                    index < currentIdx ? 'bg-monster-green/60' : 'bg-monster-border'
                  }`}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
