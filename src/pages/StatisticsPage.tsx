import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  Calendar,
  Copy,
  Globe,
  Layers,
  Package,
  PackageOpen,
  Target,
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { BarChart } from '../components/stats/BarChart'
import { StatTile } from '../components/stats/StatTile'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { useMasterCans } from '../hooks/useMasterCans'
import { computeCollectorStatistics } from '../lib/collectorStats'
import { formatProgressLabel, formatProgressPercent } from '../lib/collectionProgress'

export function StatisticsPage() {
  const { storageUserId } = useAuth()
  const { cans, loading, error } = useCans(storageUserId)
  const { masters, loading: mastersLoading } = useMasterCans('all')

  const stats = useMemo(
    () => computeCollectorStatistics(cans, masters),
    [cans, masters],
  )

  const pageLoading = loading || mastersLoading

  return (
    <Layout title="Statistics">
      {pageLoading ? (
        <LoadingSpinner label="Crunching your stats..." />
      ) : error ? (
        <EmptyState title="Could not load collection" description={error} />
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-monster-muted">
            Insights into your collection — totals, duplicates, geography, and growth over time.
          </p>

          {/* Completion */}
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-monster-green" />
                <p className="text-sm font-semibold text-white">Global DB Completion</p>
              </div>
              <p className="text-xs text-monster-muted">
                {formatProgressPercent({
                  owned: stats.completionOwned,
                  total: stats.completionTotal,
                  percentage: stats.completionPercentage,
                  missing: stats.completionTotal - stats.completionOwned,
                })}
              </p>
            </div>
            <p className="mb-2 text-2xl font-bold text-white">
              {formatProgressLabel({
                owned: stats.completionOwned,
                total: stats.completionTotal,
                percentage: stats.completionPercentage,
                missing: stats.completionTotal - stats.completionOwned,
              })}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-monster-border">
              <div
                className="h-full rounded-full bg-monster-green transition-all duration-500"
                style={{ width: `${Math.min(100, stats.completionPercentage)}%` }}
              />
            </div>
          </Card>

          {/* Core stats grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile label="Total Cans" value={stats.total} icon={<Layers size={16} />} />
            <StatTile label="Opened" value={stats.opened} icon={<PackageOpen size={16} />} />
            <StatTile label="Unopened" value={stats.unopened} icon={<Package size={16} />} />
            <StatTile label="Duplicates" value={stats.duplicates} icon={<Copy size={16} />} subtext="Extra copies" />
            <StatTile label="Trade Cans" value={stats.tradeCans} icon={<ArrowLeftRight size={16} />} />
            <StatTile label="Countries" value={stats.countriesRepresented} icon={<Globe size={16} />} />
          </div>

          {/* Oldest / newest */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Card className="p-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-monster-muted">
                <Calendar size={14} className="text-monster-green" />
                Oldest can
              </div>
              {stats.oldest ? (
                <>
                  <p className="font-semibold text-white">{stats.oldest.name}</p>
                  <p className="text-xs text-monster-muted">{stats.oldest.date}</p>
                  <Link to={`/can/${stats.oldest.id}`} className="mt-1 text-xs text-monster-green hover:underline">
                    View
                  </Link>
                </>
              ) : (
                <p className="text-sm text-monster-muted">—</p>
              )}
            </Card>
            <Card className="p-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-monster-muted">
                <Calendar size={14} className="text-monster-green" />
                Newest can
              </div>
              {stats.newest ? (
                <>
                  <p className="font-semibold text-white">{stats.newest.name}</p>
                  <p className="text-xs text-monster-muted">{stats.newest.date}</p>
                  <Link to={`/can/${stats.newest.id}`} className="mt-1 text-xs text-monster-green hover:underline">
                    View
                  </Link>
                </>
              ) : (
                <p className="text-sm text-monster-muted">—</p>
              )}
            </Card>
          </div>

          {/* Charts */}
          <div className="flex items-center gap-2 pt-1">
            <BarChart3 size={18} className="text-monster-green" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-monster-muted">Charts</h2>
          </div>

          <BarChart
            title="Collection by Country"
            data={stats.byCountry}
            emptyMessage="Add cans with a country to see this chart."
          />

          <BarChart
            title="Collection by Brand"
            data={stats.byBrand}
            emptyMessage="Add cans with a brand to see this chart."
          />

          <BarChart
            title="Collection Growth by Month"
            data={stats.growthByMonth}
            emptyMessage="Add cans to track monthly growth."
            maxBars={12}
          />
        </div>
      )}
    </Layout>
  )
}
