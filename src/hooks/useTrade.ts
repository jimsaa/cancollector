import { useCallback, useEffect, useState } from 'react'
import type { TradeListing, TradeMatchPreview, TradeProfile, TradeWant } from '../types/trade'
import type { Can } from '../types/can'
import { findTradeMatches } from '../lib/tradeMatching'
import {
  ensureTradeProfile,
  fetchTradeProfile,
  fetchUserListings,
  fetchUserWants,
  updateTradeProfile,
} from '../lib/tradeSync'
import { useGuestStorage } from '../lib/guestStorage'

export function useTrade(userId: string | undefined, cans: Can[]) {
  const [profile, setProfile] = useState<TradeProfile | null>(null)
  const [listings, setListings] = useState<TradeListing[]>([])
  const [wants, setWants] = useState<TradeWant[]>([])
  const [matches, setMatches] = useState<TradeMatchPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setListings([])
      setWants([])
      setMatches([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!useGuestStorage()) await ensureTradeProfile(userId)

      const [tradeProfile, tradeListings, tradeWants] = await Promise.all([
        fetchTradeProfile(userId),
        fetchUserListings(userId, cans),
        fetchUserWants(userId, cans),
      ])

      const tradeMatches = await findTradeMatches(userId, tradeWants)

      setProfile(tradeProfile)
      setListings(tradeListings)
      setWants(tradeWants)
      setMatches(tradeMatches)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trade data')
    } finally {
      setLoading(false)
    }
  }, [userId, cans])

  useEffect(() => {
    load()
  }, [load])

  const setMatchingEnabled = useCallback(
    async (enabled: boolean) => {
      if (!userId) return
      const updated = await updateTradeProfile(userId, { matching_enabled: enabled })
      setProfile(updated)
      await load()
    },
    [userId, load],
  )

  return {
    profile,
    listings,
    wants,
    matches,
    loading,
    error,
    reload: load,
    setMatchingEnabled,
    matchingAvailable: !useGuestStorage(),
  }
}
