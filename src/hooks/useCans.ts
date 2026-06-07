import { useCallback, useEffect, useState } from 'react'
import type { Can, CanInsert, CanUpdate } from '../types/can'
import { createCan, deleteCan, fetchCans, importCans, updateCan } from '../lib/cans'

export function useCans(userId: string | undefined) {
  const [cans, setCans] = useState<Can[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setCans([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchCans(userId)
      setCans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collection')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(
    async (can: CanInsert) => {
      if (!userId) throw new Error('Not authenticated')
      const created = await createCan(userId, can)
      setCans((prev) => [created, ...prev])
      return created
    },
    [userId],
  )

  const update = useCallback(async (id: string, updates: CanUpdate) => {
    const updated = await updateCan(id, updates)
    setCans((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteCan(id)
    setCans((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const importCollection = useCallback(
    async (items: Can[], mode: 'merge' | 'replace') => {
      if (!userId) throw new Error('Not authenticated')
      await importCans(userId, items, mode)
      await load()
    },
    [userId, load],
  )

  return { cans, loading, error, reload: load, add, update, remove, importCollection }
}
