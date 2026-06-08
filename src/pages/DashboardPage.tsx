import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, PackageOpen, ArrowLeftRight, Layers, PlusCircle, BarChart3 } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { BrandFilter } from '../components/master/BrandFilter'
import { CollectionProgressCard } from '../components/master/CollectionProgressCard'
import { Card } from '../components/ui/Card'
import { CanCard } from '../components/cans/CanCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { useMasterCans } from '../hooks/useMasterCans'
import { computeStats } from '../lib/cans'
import { computeCollectionProgress } from '../lib/collectionProgress'
import { APP_NAME } from '../constants/branding'
import type { MasterBrandFilter } from '../types/masterCan'

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-monster-muted">{label}</span>
        <span className="text-monster-green">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </Card>
  )
}

export function DashboardPage() {
  const { storageUserId } = useAuth()
  const { cans, loading, error } = useCans(storageUserId)
  const [brand, setBrand] = useState<MasterBrandFilter>('all')
  const { masters, loading: mastersLoading } = useMasterCans(brand)
  const stats = computeStats(cans)
  const recent = cans.filter((c) => !c.is_wishlist).slice(0, 6)
  const progress = useMemo(
    () => computeCollectionProgress(masters, cans, brand),
    [masters, cans, brand],
  )

  return (
    <Layout title="Dashboard">
      {loading ? (
        <LoadingSpinner label="Loading collection..." />
      ) : error ? (
        <EmptyState title="Could not load collection" description={error} />
      ) : (
        <div className="flex flex-col gap-6">
          <BrandFilter value={brand} onChange={setBrand} />

          {!mastersLoading ? <CollectionProgressCard progress={progress} /> : null}

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Cans" value={stats.total} icon={<Layers size={18} />} />
            <StatCard label="Unopened" value={stats.unopened} icon={<Package size={18} />} />
            <StatCard label="Opened" value={stats.opened} icon={<PackageOpen size={18} />} />
            <StatCard label="For Trade" value={stats.forTrade} icon={<ArrowLeftRight size={18} />} />
          </div>

          <Link
            to="/stats"
            className="flex items-center justify-center gap-2 rounded-xl border border-monster-border bg-monster-card px-4 py-3 text-sm font-medium text-monster-green transition-colors hover:border-monster-green/50"
          >
            <BarChart3 size={18} />
            View full statistics
          </Link>

          <Link to="/add">
            <Button fullWidth className="py-4 text-base">
              <PlusCircle size={22} />
              Scan & Add Can
            </Button>
          </Link>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-monster-muted">
                Recently Added
              </h2>
              {cans.length > 0 ? (
                <Link to="/collection" className="text-xs text-monster-green hover:underline">
                  View all
                </Link>
              ) : null}
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon={<Package size={40} />}
                title="No cans yet"
                description={`Scan your first can to start your ${APP_NAME} collection.`}
                action={
                  <Link to="/add">
                    <Button>Add Your First Can</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recent.map((can) => (
                  <CanCard key={can.id} can={can} compact />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Layout>
  )
}
