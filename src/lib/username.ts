const USERNAME_PATTERN = /^[a-z0-9_-]{3,24}$/

export function normalizeUsernameInput(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsernameInput(username)
  if (!normalized) return 'Username is required'
  if (normalized.length < 3) return 'Username must be at least 3 characters'
  if (normalized.length > 24) return 'Username must be 24 characters or fewer'
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use lowercase letters, numbers, hyphens, and underscores only'
  }
  return null
}

export function publicProfilePath(username: string): string {
  return `/u/${encodeURIComponent(username.toLowerCase())}`
}
