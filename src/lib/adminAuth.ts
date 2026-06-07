import type { Profile } from '../types/profile'

const LOCAL_ADMIN_SESSION_KEY = 'cancollector-local-admin-session'

export type AdminAccessState = 'loading' | 'denied' | 'pin_required' | 'granted'

export function getAdminPin(): string {
  return import.meta.env.VITE_ADMIN_PIN ?? '3513'
}

export function isLocalAdminSessionActive(): boolean {
  try {
    return sessionStorage.getItem(LOCAL_ADMIN_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function activateLocalAdminSession(pin: string): boolean {
  if (pin !== getAdminPin()) return false
  try {
    sessionStorage.setItem(LOCAL_ADMIN_SESSION_KEY, '1')
    return true
  } catch {
    return false
  }
}

export function clearLocalAdminSession(): void {
  try {
    sessionStorage.removeItem(LOCAL_ADMIN_SESSION_KEY)
  } catch {
    // ignore
  }
}

export function isProfileAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin'
}

/** Cloud: profile.role. Local/guest: simulated admin PIN session for testing. */
export function getAdminAccessState(options: {
  loading: boolean
  isGuest: boolean
  isConfigured: boolean
  profile: Profile | null
}): AdminAccessState {
  if (options.loading) return 'loading'

  if (options.isConfigured && !options.isGuest) {
    return isProfileAdmin(options.profile) ? 'granted' : 'denied'
  }

  return isLocalAdminSessionActive() ? 'granted' : 'pin_required'
}

export function canPerformAdminActions(options: {
  isGuest: boolean
  isConfigured: boolean
  profile: Profile | null
}): boolean {
  return getAdminAccessState({ ...options, loading: false }) === 'granted'
}
