import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { APP_NAME } from '../../constants/branding'
import { Logo } from '../brand/Logo'
import { Button } from '../ui/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'cancollector-install-dismissed'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
    setDismissed(true)
    setDeferredPrompt(null)
  }

  if (isStandalone || dismissed || !deferredPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-lg">
      <div className="flex items-start gap-3 rounded-2xl border border-monster-green/40 bg-monster-card p-4 shadow-lg">
        <Logo size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Install {APP_NAME}</p>
          <p className="mt-0.5 text-xs text-monster-muted">
            Add to your home screen for quick access and HTTPS camera scanning.
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" onClick={handleInstall} className="py-2 text-xs">
              <Download size={16} />
              Install
            </Button>
            <Button type="button" variant="ghost" onClick={handleDismiss} className="py-2 text-xs">
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 text-monster-muted hover:text-white"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
