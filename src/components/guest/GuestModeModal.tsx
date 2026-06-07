import { Link } from 'react-router-dom'
import { Cloud, HardDrive, Smartphone, UserPlus } from 'lucide-react'
import { Button } from '../ui/Button'

interface GuestModeModalProps {
  open: boolean
  onClose: () => void
  canRegister: boolean
}

export function GuestModeModal({ open, onClose, canRegister }: GuestModeModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-monster-border bg-monster-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="guest-mode-title"
      >
        <h2 id="guest-mode-title" className="text-lg font-bold text-white">
          How Guest Mode works
        </h2>
        <p className="mt-2 text-sm text-monster-muted">
          You can collect cans right away — no account needed. Here is what to know:
        </p>

        <ul className="mt-4 flex flex-col gap-3">
          <li className="flex items-start gap-3 text-sm text-white">
            <HardDrive size={18} className="mt-0.5 shrink-0 text-yellow-400" />
            <span>Your cans are saved in this browser and on this device only.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-white">
            <Smartphone size={18} className="mt-0.5 shrink-0 text-yellow-400" />
            <span>
              If you clear browser data, switch phones, uninstall the app, or use another device,
              your collection may be lost.
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm text-white">
            <Cloud size={18} className="mt-0.5 shrink-0 text-monster-green" />
            <span>
              Creating a{' '}
              <span className="font-semibold text-monster-green">free account</span> saves your
              collection online so you can access it anywhere.
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm text-white">
            <UserPlus size={18} className="mt-0.5 shrink-0 text-monster-green" />
            <span>
              After registering, you can import your local collection into your account in one step.
            </span>
          </li>
        </ul>

        <p className="mt-4 text-xs text-monster-muted">
          Registration is free. Premium is optional and only adds advanced features later.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link to="/register" onClick={onClose}>
            <Button fullWidth>
              {canRegister ? 'Create Free Account' : 'Set Up Cloud Account'}
            </Button>
          </Link>
          {!canRegister ? (
            <p className="text-center text-xs text-monster-muted">
              Add Supabase keys to <code className="text-monster-green">.env</code> to enable cloud
              registration. Guest mode works without it.
            </p>
          ) : null}
          <Button variant="secondary" fullWidth onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
