import { useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { CanCard } from '../components/cans/CanCard'
import { CanFiltersBar } from '../components/cans/CanFilters'
import { BackupControls } from '../components/cans/BackupControls'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { defaultFilters, filterAndSortCans, getUniqueCountries } from '../lib/filters'
import { Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function CollectionPage() {
  const { user } = useAuth()
  const { cans, loading, error, importCollection } = useCans(user?.id)
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
                ? 'Start building your Monster Energy collection.'
                : 'Try adjusting your search or filters.'
            }
            action={
              collection.length === 0 ? (
                <Link to="/add">
                  <Button>Add Can</Button>
                </Link>
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

        {user ? (
          <BackupControls cans={cans} userId={user.id} onImport={importCollection} />
        ) : null}
      </div>
    </Layout>
  )
}
