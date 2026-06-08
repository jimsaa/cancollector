import type { Can } from '../types/can'
import type { CollectionSetName } from '../types/collectionSet'
import type { Profile } from '../types/profile'
import type { TradeListing } from '../types/trade'
import type { PendingCanSuggestion } from '../types/pendingSuggestion'
import { computeCollectionSetProgress } from './collectionSets'
import { computeCollectionProgress } from './collectionProgress'
import type { MasterCan } from '../types/masterCan'

export interface BadgeComputeInput {
  profile: Pick<Profile, 'premium_source' | 'is_premium'> | null
  cans: Can[]
  masters: MasterCan[]
  tradeListings: TradeListing[]
  feedbackCount: number
  approvedSuggestions: PendingCanSuggestion[]
}

const COLLECTION_MILESTONES: Array<{ id: string; min: number }> = [
  { id: 'first_can', min: 1 },
  { id: 'cans_10', min: 10 },
  { id: 'cans_25', min: 25 },
  { id: 'cans_50', min: 50 },
  { id: 'cans_100', min: 100 },
  { id: 'cans_250', min: 250 },
  { id: 'cans_500', min: 500 },
]

const SET_BADGE_MAP: Partial<Record<CollectionSetName, string>> = {
  Ultra: 'ultra_collector',
  Java: 'java_collector',
  Juice: 'juice_collector',
  Rehab: 'rehab_collector',
  Reserve: 'reserve_collector',
  Nitro: 'nitro_collector',
  'Zero Sugar': 'zero_sugar_collector',
}

function collectionTotal(cans: Can[]): number {
  return cans.filter((c) => !c.is_wishlist).reduce((sum, c) => sum + c.quantity, 0)
}

function qualifiesForSetBadge(owned: number, total: number, percentage: number): boolean {
  if (total === 0) return false
  if (percentage === 100) return true
  return owned >= 3 && percentage >= 25
}

export function computeEarnedBadgeIds(input: BadgeComputeInput): string[] {
  const earned = new Set<string>()
  const collection = input.cans.filter((c) => !c.is_wishlist)
  const total = collectionTotal(input.cans)

  for (const milestone of COLLECTION_MILESTONES) {
    if (total >= milestone.min) earned.add(milestone.id)
  }

  const setProgress = computeCollectionSetProgress(input.masters, input.cans)
  for (const row of setProgress) {
    const badgeId = SET_BADGE_MAP[row.set]
    if (badgeId && qualifiesForSetBadge(row.owned, row.total, row.percentage)) {
      earned.add(badgeId)
    }
  }

  const activeListings = input.tradeListings.filter((l) => l.trade_status === 'available')
  if (activeListings.length >= 1) earned.add('first_trade_listing')
  if (activeListings.length >= 3) earned.add('active_trader')
  if (collection.some((c) => c.available_for_trade)) earned.add('trade_ready')

  const approved = input.approvedSuggestions
  if (approved.some((s) => s.suggestion_type === 'attach_barcode' || s.barcode)) {
    earned.add('barcode_helper')
  }
  if (approved.some((s) => s.image_url)) earned.add('image_contributor')
  if (approved.length > 0) earned.add('master_db_contributor')

  if (input.feedbackCount > 0) earned.add('feedback_helper')

  const source = input.profile?.premium_source?.toLowerCase()
  if (source === 'beta_tester') earned.add('beta_tester')
  if (source === 'founder') earned.add('founder')
  if (source === 'community_contributor') earned.add('community_contributor')

  return [...earned]
}

export function computeCompletionPercent(input: BadgeComputeInput): number {
  const progress = computeCollectionProgress(input.masters, input.cans, 'all')
  return progress.percentage
}
