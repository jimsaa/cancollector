import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { CanCard } from '../components/cans/CanCard'
import { CanFiltersBar } from '../components/cans/CanFilters'
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
  const { cans, loading, error } = useCans(user?.id)
  const [filters, setFilters] = useState(defaultFilters)

  const filtered = filterAndSortCans(cans, filters)
  const countries = getUniqueCountries(cans)

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
            title={cans.length === 0 ? 'Collection is empty' : 'No matching cans'}
            description={
              cans.length === 0
                ? 'Start building your Monster Energy collection.'
                : 'Try adjusting your search or filters.'
            }
            action={
              cans.length === 0 ? (
                <Link to="/add">
                  <Button>Add Can</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="text-xs text-monster-muted">
              {filtered.length} of {cans.length} cans
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((can) => (
                <CanCard key={can.id} can={can} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
