import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { BrandFilter } from '../components/master/BrandFilter'
import { SetProgressCard } from '../components/master/SetProgressCard'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { useMasterCans } from '../hooks/useMasterCans'
import { computeCollectionSetProgress } from '../lib/collectionSets'
import type { MasterBrandFilter } from '../types/masterCan'
export function CollectionSetsPage() {
  const { storageUserId } = useAuth()
  const { cans, loading: cansLoading } = useCans(storageUserId)
  const [brand, setBrand] = useState<MasterBrandFilter>('all')
  const { masters, loading: mastersLoading, error } = useMasterCans(brand)

  const sets = useMemo(
    () => computeCollectionSetProgress(masters, cans),
    [masters, cans],
  )

  const sorted = useMemo(
    () => [...sets].sort((a, b) => b.percentage - a.percentage || b.owned - a.owned),
    [sets],
  )

  const loading = cansLoading || mastersLoading

  return (
    <Layout title="Collection Sets">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Track completion across Monster Energy product lines. Tap a set to browse what you&apos;re
          missing.
        </p>

        <BrandFilter value={brand} onChange={setBrand} />

        <Link
          to="/missing"
          className="text-xs text-monster-green hover:underline"
        >
          View all missing cans →
        </Link>

        {loading ? (
          <LoadingSpinner label="Loading sets..." />
        ) : error ? (
          <EmptyState title="Could not load sets" description={error} />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<Layers size={40} />}
            title="No sets found"
            description="Master catalog has no active cans for this brand filter."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((progress) => (
              <SetProgressCard key={progress.set} progress={progress} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
