import type { Profile } from '../types/profile'

export interface PremiumFeatures {
  canExportBackup: boolean
  canImportBackup: boolean
  canUseCloudBackup: boolean
  maxActiveTradeListings: number
  maxTradeImages: number
  canUseTradeVideo: boolean
  canUsePriorityTradeBadge: boolean
}

export function isPremiumActive(profile: Profile | null): boolean {
  if (!profile || profile.premium_status !== 'premium') return false
  if (profile.premium_until && new Date(profile.premium_until) < new Date()) return false
  return true
}

export function getPremiumFeatures(
  profile: Profile | null,
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
  }
}

export function hasCloudAccount(isCloudSynced: boolean): boolean {
  return isCloudSynced
}
