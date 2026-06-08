import { Smartphone, Share, X } from 'lucide-react'
import { APP_NAME } from '../../constants/branding'
import { Button } from '../ui/Button'

interface InstallInstructionsModalProps {
  open: boolean
  onClose: () => void
  isIos: boolean
}

export function InstallInstructionsModal({ open, onClose, isIos }: InstallInstructionsModalProps) {
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
        aria-labelledby="pwa-install-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-monster-green" />
            <h2 id="pwa-install-title" className="text-lg font-bold text-white">
              Install {APP_NAME}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-monster-muted hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {isIos ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white">
            <li>
              Tap <Share size={14} className="inline text-monster-green" /> Share in Safari
            </li>
            <li>
              Choose <span className="font-semibold">Add to Home Screen</span>
            </li>
            <li>Tap <span className="font-semibold">Add</span> to install the app</li>
          </ol>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-white">
            <li>
              <span className="font-semibold text-monster-green">Chrome / Edge:</span> open the
              browser menu and choose <span className="font-semibold">Install app</span> or{' '}
              <span className="font-semibold">Add to Home screen</span>.
            </li>
            <li>
              <span className="font-semibold text-monster-green">Desktop:</span> look for the install
              icon in the address bar.
            </li>
            <li className="text-monster-muted">
              If no install option appears, try visiting over HTTPS and reload the page.
            </li>
          </ul>
        )}

        <p className="mt-4 text-xs text-monster-muted">
          Installing gives you home-screen access and reliable HTTPS camera scanning.
        </p>

        <Button variant="secondary" fullWidth className="mt-5" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  )
}
