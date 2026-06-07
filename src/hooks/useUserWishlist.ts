import { useCallback, useEffect, useState } from 'react'
import { fetchUserWishlist, getWishlistedMasterIds } from '../lib/userWishlist'
import type { UserWishlistEntry } from '../types/userWishlist'

export function useUserWishlist(userId: string | undefined) {
  const [entries, setEntries] = useState<UserWishlistEntry[]>([])
  const [masterIds, setMasterIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setMasterIds(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [list, ids] = await Promise.all([
        fetchUserWishlist(userId),
        getWishlistedMasterIds(userId),
      ])
      setEntries(list)
      setMasterIds(ids)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { entries, masterIds, loading, reload }
}
