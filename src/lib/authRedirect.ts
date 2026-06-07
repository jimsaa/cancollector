/** Redirect URL for Supabase email confirmation — uses current origin (local or Vercel). */
export function getAuthCallbackUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/auth/callback`
  }
  return '/auth/callback'
}
