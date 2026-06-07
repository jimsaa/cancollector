import type { TradeListing, TradeMatchPreview, TradeMatchType, TradeWant } from '../types/trade'
import { normalizeKey } from './duplicates'
import { useGuestStorage } from './guestStorage'
import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase client unavailable')
  return supabase
}

function scoreMatch(want: TradeWant, listing: TradeListing): { type: TradeMatchType; score: number } | null {
  const wantBarcode = (want.barcode ?? '').trim()
  const listBarcode = (listing.barcode ?? '').trim()

  if (wantBarcode && listBarcode && wantBarcode === listBarcode) {
    return { type: 'barcode', score: 100 }
  }

  if (want.master_can_id && listing.master_can_id && want.master_can_id === listing.master_can_id) {
    return { type: 'master_can', score: 95 }
  }

  const wantBrand = normalizeKey(want.brand)
  const wantFlavor = normalizeKey(want.flavor)
  const listBrand = normalizeKey(listing.brand)
  const listFlavor = normalizeKey(listing.flavor)

  if (wantBrand && listBrand && wantBrand === listBrand && wantFlavor && listFlavor && wantFlavor === listFlavor) {
    return { type: 'brand_flavor', score: 60 }
  }

  return null
}

export function computeLocalMatches(
  myWants: TradeWant[],
  otherListings: TradeListing[],
  myUserId: string,
): TradeMatchPreview[] {
  const previews: TradeMatchPreview[] = []

  for (const want of myWants) {
    for (const listing of otherListings) {
      if (listing.user_id === myUserId) continue
      const match = scoreMatch(want, listing)
      if (!match) continue

      previews.push({
        want,
        listing,
        matchType: match.type,
        matchScore: match.score,
        offererUserId: listing.user_id,
      })
    }
  }

  return previews.sort((a, b) => b.matchScore - a.matchScore)
}

export async function fetchOtherActiveListings(userId: string): Promise<TradeListing[]> {
  if (useGuestStorage()) return []

  const client = requireClient()
  const { data, error } = await client
    .from('trade_listings')
    .select('*')
    .eq('trade_status', 'available')
    .neq('user_id', userId)

  if (error) throw error
  return (data ?? []) as TradeListing[]
}

export async function findTradeMatches(
  userId: string,
  myWants: TradeWant[],
): Promise<TradeMatchPreview[]> {
  if (useGuestStorage() || myWants.length === 0) return []

  const otherListings = await fetchOtherActiveListings(userId)
  return computeLocalMatches(myWants, otherListings, userId)
}
