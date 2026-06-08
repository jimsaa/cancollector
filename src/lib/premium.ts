import type { Profile } from '../types/profile'

export interface PremiumFeatures {
  canExportBackup: boolean
  canImportBackup: boolean
  canUseCloudBackup: boolean
  maxActiveTradeListings: number
  maxTradeImages: number
  canUseTradeVideo: boolean
  canUsePriorityTradeBadge: boolean
  /** Free: 6 recent cans on public profile; premium: larger gallery */
  maxPublicRecentCans: number
  canUseCustomProfileTheme: boolean
  canUseFeaturedCans: boolean
  canUseVerifiedCollectorBadge: boolean
}

type PremiumProfileFields = Pick<
  Profile,
  'premium_status' | 'premium_until' | 'is_premium' | 'premium_expires_at'
>

function getPremiumExpiry(profile: PremiumProfileFields): string | null {
  return profile.premium_expires_at ?? profile.premium_until ?? null
}

export function isPremiumActive(profile: PremiumProfileFields | null): boolean {
  if (!profile) return false

  const activeViaFlag = profile.is_premium === true
  const activeViaLegacy = profile.premium_status === 'premium'
  if (!activeViaFlag && !activeViaLegacy) return false

  const expiresAt = getPremiumExpiry(profile)
  if (expiresAt && new Date(expiresAt) < new Date()) return false

  return true
}

export function getPremiumFeatures(
  profile: PremiumProfileFields | null,
  options: { isCloudMode: boolean },
): PremiumFeatures {
  const isPremium = isPremiumActive(profile)
  return {
    canExportBackup: isPremium,
    canImportBackup: isPremium,
    canUseCloudBackup: isPremium && options.isCloudMode,
    maxActiveTradeListings: isPremium ? 999 : 1,
    maxTradeImages: isPremium ? 5 : 2,
    canUseTradeVideo: true,
    canUsePriorityTradeBadge: isPremium,
    maxPublicRecentCans: isPremium ? 24 : 6,
    canUseCustomProfileTheme: isPremium,
    canUseFeaturedCans: isPremium,
    canUseVerifiedCollectorBadge: isPremium,
  }
}

export function hasCloudAccount(isCloudSynced: boolean): boolean {
  return isCloudSynced
}
