export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Listener = () => void

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<Listener>()
let listenerAttached = false

function notify(): void {
  listeners.forEach((listener) => listener())
}

function attachInstallListener(): void {
  if (listenerAttached || typeof window === 'undefined') return
  listenerAttached = true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function subscribePwaInstall(listener: Listener): () => void {
  attachInstallListener()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null
  notify()
}

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export async function triggerPwaInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const prompt = deferredPrompt
  if (!prompt) return 'unavailable'
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  if (outcome === 'accepted') {
    clearDeferredInstallPrompt()
  }
  return outcome
}
