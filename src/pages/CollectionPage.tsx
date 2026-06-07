import { useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { CanCard } from '../components/cans/CanCard'
import { CanFiltersBar } from '../components/cans/CanFilters'
import { HardDrive } from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useGuestMessaging } from '../hooks/useGuestMessaging'
import { useCans } from '../hooks/useCans'
import { defaultFilters, filterAndSortCans, getUniqueCountries } from '../lib/filters'
import { Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function CollectionPage() {
  const { storageUserId } = useAuth()
  const { isGuest } = useGuestMessaging()
  const { cans, loading, error } = useCans(storageUserId)
  const [filters, setFilters] = useState(defaultFilters)

  const collection = useMemo(() => cans.filter((c) => !c.is_wishlist), [cans])
  const filtered = filterAndSortCans(collection, filters)
  const countries = getUniqueCountries(collection)

  return (
    <Layout title="Collection">
      <div className="flex flex-col gap-4">
        <CanFiltersBar filters={filters} onChange={setFilters} countries={countries} />

        {loading ? (
          <LoadingSpinner label="Loading cans..." />
        ) : error ? (
          <EmptyState title="Error loading collection" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={40} />}
            title={collection.length === 0 ? 'Collection is empty' : 'No matching cans'}
            description={
              collection.length === 0
                ? isGuest
                  ? 'Start collecting locally, or create a free account to keep your collection safe.'
                  : 'Start building your energy drink can collection.'
                : 'Try adjusting your search or filters.'
            }
            action={
              collection.length === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <Link to="/add">
                    <Button>Add Can</Button>
                  </Link>
                  {isGuest ? (
                    <Link to="/register" className="text-xs text-monster-green hover:underline">
                      Create free account
                    </Link>
                  ) : null}
                </div>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="text-xs text-monster-muted">
              {filtered.length} of {collection.length} cans
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((can) => (
                <CanCard key={can.id} can={can} />
              ))}
            </div>
          </>
        )}

        {storageUserId ? (
          <Link
            to="/backup"
            className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-card p-4 transition-colors hover:border-monster-green/50"
          >
            <HardDrive size={22} className="text-monster-green" />
            <div>
              <p className="text-sm font-semibold text-white">Backup & Restore</p>
              <p className="text-xs text-monster-muted">Export or import your collection</p>
            </div>
          </Link>
        ) : null}
      </div>
    </Layout>
  )
}
