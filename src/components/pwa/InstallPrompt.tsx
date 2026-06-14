import { useState } from 'react'
import { Download, X } from 'lucide-react'
import { APP_NAME } from '../../constants/branding'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { Logo } from '../brand/Logo'
import { Button } from '../ui/Button'
import { InstallInstructionsModal } from './InstallInstructionsModal'

const DISMISS_KEY = 'cancollector-install-dismissed'

export function InstallPrompt() {
  const { showInstallUi, canInstall, isIos, install } = usePwaInstall()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [showInstructions, setShowInstructions] = useState(false)

  const handleInstall = async () => {
    if (canInstall) {
      await install()
      return
    }
    setShowInstructions(true)
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  if (!showInstallUi || dismissed) return null

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3 sm:px-4"
        style={{
          bottom: 'max(5.25rem, calc(env(safe-area-inset-bottom, 0px) + 5.25rem))',
        }}
      >
        <div className="pointer-events-auto w-full max-w-lg">
          <div className="max-h-[min(42dvh,calc(100dvh-env(safe-area-inset-top)-10rem))] overflow-y-auto rounded-2xl border border-monster-green/40 bg-monster-card p-3 shadow-lg sm:p-4">
            <div className="flex items-start gap-3">
              <Logo size="md" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Install {APP_NAME}</p>
                <p className="mt-0.5 text-xs text-monster-muted">
                  Add to your home screen for quick access and HTTPS camera scanning.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void handleInstall()} className="py-2 text-xs">
                    <Download size={16} />
                    {canInstall ? 'Install' : isIos ? 'How to install' : 'Install'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleDismiss} className="py-2 text-xs">
                    Not now
                  </Button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-lg p-1 text-monster-muted hover:bg-monster-dark hover:text-white"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <InstallInstructionsModal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        isIos={isIos}
      />
    </>
  )
}
