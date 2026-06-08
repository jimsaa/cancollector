import { useCallback, useEffect, useState } from 'react'
import type { UserCanStatusMap } from '../types/userCanStatus'
import { getUserCanStatusMap } from '../lib/userCanStatus'

export function useUserCanStatus(userId: string | null | undefined) {
  const [statusMap, setStatusMap] = useState<UserCanStatusMap>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) {
      setStatusMap({})
      return
    }
    setLoading(true)
    setError(null)
    try {
      setStatusMap(await getUserCanStatusMap(userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collector status')
      setStatusMap({})
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { statusMap, loading, error, reload, setStatusMap }
}
