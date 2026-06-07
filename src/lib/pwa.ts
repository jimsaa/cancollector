import { registerSW } from 'virtual:pwa-register'

export function registerPWA(): void {
  registerSW({
    immediate: true,
    onRegistered(registration) {
      if (registration) {
        console.info('PWA service worker registered')
      }
    },
    onRegisterError(error) {
      console.error('PWA registration failed:', error)
    },
  })
}
