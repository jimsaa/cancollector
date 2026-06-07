import { useCallback, useEffect, useState } from 'react'
import type { TradeListing, TradeListingUpdate } from '../types/trade'
import type { Can } from '../types/can'
import {
  ensureTradeListingForCan,
  fetchTradeListingByCanId,
  updateTradeListing,
} from '../lib/tradeListings'

export function useTradeListing(
  can: Can | null,
  maxActiveListings: number,
) {
  const [listing, setListing] = useState<TradeListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!can || !can.available_for_trade || can.is_wishlist) {
      setListing(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      let data = await fetchTradeListingByCanId(can.id)
      if (!data) {
        data = await ensureTradeListingForCan(can, maxActiveListings)
      }
      setListing(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trade listing')
      setListing(null)
    } finally {
      setLoading(false)
    }
  }, [can, maxActiveListings])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async (updates: TradeListingUpdate) => {
      if (!listing) return null
      setSaving(true)
      setError(null)
      try {
        const updated = await updateTradeListing(listing.id, updates)
        setListing(updated)
        return updated
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save listing')
        throw err
      } finally {
        setSaving(false)
      }
    },
    [listing],
  )

  return { listing, loading, saving, error, save, reload: load }
}
