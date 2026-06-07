import { useCallback, useEffect, useState } from 'react'
import type { MasterBrandFilter, MasterCan } from '../types/masterCan'
import { fetchMasterCans } from '../lib/masterCans'

export function useMasterCans(brand: MasterBrandFilter = 'all') {
  const [masters, setMasters] = useState<MasterCan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMasterCans(brand)
      setMasters(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load can database')
    } finally {
      setLoading(false)
    }
  }, [brand])

  useEffect(() => {
    load()
  }, [load])

  return { masters, loading, error, reload: load }
}
