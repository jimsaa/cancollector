/** localStorage key — set to "true" after a valid beta code is entered. */
export const BETA_ACCESS_STORAGE_KEY = 'cantrove_beta_access'

export const BETA_ACCESS_CODE = 'beta2026'

/** Dev reset: localStorage.removeItem("cantrove_beta_access") */
export function hasBetaAccess(): boolean {
  try {
    return localStorage.getItem(BETA_ACCESS_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function grantBetaAccess(): void {
  try {
    localStorage.setItem(BETA_ACCESS_STORAGE_KEY, 'true')
  } catch {
    // ignore quota / private mode
  }
}

export function clearBetaAccess(): void {
  try {
    localStorage.removeItem(BETA_ACCESS_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function isValidBetaCode(code: string): boolean {
  return code.trim() === BETA_ACCESS_CODE
}
