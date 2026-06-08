import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, Package, Shield } from 'lucide-react'
import { AdminHubNav } from '../components/admin/AdminHubNav'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import {
  activateLocalAdminSession,
  clearLocalAdminSession,
  getAdminAccessState,
  getAdminPin,
} from '../lib/adminAuth'
import { fetchOfficialImportPending } from '../lib/officialProductImport'
import { fetchPendingSuggestions } from '../lib/pendingSuggestions'
import { fetchActiveMasterCans } from '../lib/masterCans'
import { MASTER_IMPORT_SOURCES, type MasterImportSource } from '../types/masterImport'

interface ImportStats {
  pendingOfficial: number
  pendingScans: number
  masterCount: number
}

function ImportSourceCard({ source, pendingCount }: { source: MasterImportSource; pendingCount?: number }) {
  const isActive = source.status === 'active'

  return (
    <Card className={`p-4 ${isActive ? 'border-monster-green/30' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Package size={18} className="shrink-0 text-monster-green" />
            <p className="font-semibold text-white">{source.label}</p>
            {!isActive ? (
              <span className="rounded-full bg-monster-dark px-2 py-0.5 text-[10px] uppercase tracking-wide text-monster-muted">
                Planned
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-monster-muted">{source.description}</p>
          {source.importScript ? (
            <p className="mt-2 text-[10px] text-monster-muted">
              Import: <code className="text-monster-green">npm run {source.importScript}</code>
            </p>
          ) : null}
          {typeof pendingCount === 'number' && isActive ? (
            <p className="mt-1 text-xs text-monster-green">
              {pendingCount} pending review{pendingCount === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
        {isActive ? (
          <Link to={source.reviewRoute}>
            <Button className="shrink-0 py-2 text-xs">
              Review
              <ArrowRight size={14} />
            </Button>
          </Link>
        ) : (
          <Button className="shrink-0 py-2 text-xs" disabled>
            Soon
          </Button>
        )}
      </div>
    </Card>
  )
}

export function AdminImportsPage() {
  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [localAdmin, setLocalAdmin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const access = getAdminAccessState({
    loading: authLoading,
    isGuest,
    isConfigured,
    profile,
  })

  const granted = access === 'granted' || (access === 'pin_required' && localAdmin)

  const load = useCallback(async () => {
    if (!granted) return
    setLoading(true)
    setError(null)
    try {
      const [officialPending, allPending, masters] = await Promise.all([
        fetchOfficialImportPending(),
        fetchPendingSuggestions('pending'),
        fetchActiveMasterCans('all'),
      ])
      const scanPending = allPending.filter((row) => row.source !== 'official_site')
      setStats({
        pendingOfficial: officialPending.length,
        pendingScans: scanPending.length,
        masterCount: masters.length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load import stats')
    } finally {
      setLoading(false)
    }
  }, [granted])

  useEffect(() => {
    if (granted) void load()
  }, [granted, load])

  const handleLocalLogin = () => {
    if (activateLocalAdminSession(pin)) {
      setLocalAdmin(true)
      setPinError(null)
    } else {
      setPinError('Invalid admin PIN')
    }
  }

  if (access === 'loading') {
    return (
      <Layout title="Master Imports">
        <LoadingSpinner label="Checking admin access..." />
      </Layout>
    )
  }

  if (access === 'denied') {
    return (
      <Layout title="Master Imports">
        <EmptyAccess
          title="Admin access required"
          description="Sign in with an admin account or use local admin simulation in guest mode."
        />
      </Layout>
    )
  }

  if (access === 'pin_required' && !localAdmin) {
    return (
      <Layout title="Master Imports">
        <Card className="mx-auto max-w-sm p-4">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={20} className="text-monster-green" />
            <p className="font-semibold text-white">Local Admin Simulation</p>
          </div>
          <Input
            label="Admin PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLocalLogin()}
          />
          {pinError ? <p className="mt-2 text-sm text-red-400">{pinError}</p> : null}
          <Button fullWidth className="mt-4" onClick={handleLocalLogin}>
            Enter Admin
          </Button>
          <p className="mt-3 text-center text-xs text-monster-muted">
            Default PIN: <code className="text-monster-green">{getAdminPin()}</code>
          </p>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Master Imports">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-monster-muted">
              Curated master database imports with high-quality reference images. Review, edit, and
              approve products into <code className="text-monster-green">master_cans</code>.
            </p>
          </div>
          <AdminHubNav
            showExit={access === 'pin_required'}
            onExit={() => {
              clearLocalAdminSession()
              setLocalAdmin(false)
            }}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {loading ? (
          <LoadingSpinner label="Loading import dashboard..." />
        ) : stats ? (
          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Master cans" value={stats.masterCount} />
            <StatPill label="Pending imports" value={stats.pendingOfficial} accent />
            <StatPill label="Scan suggestions" value={stats.pendingScans} />
          </div>
        ) : null}

        <Card className="border-monster-green/20 bg-monster-green/5 p-4">
          <div className="flex items-start gap-3">
            <Package size={18} className="mt-0.5 shrink-0 text-monster-green" />
            <div className="text-xs text-monster-muted">
              <p className="font-semibold text-white">Import pipeline</p>
              <p className="mt-1">
                1) Run brand scraper · 2) Sync JSON to pending queue · 3) Review &amp; approve · 4)
                User scans match master_cans first (Open Food Facts is fallback only)
              </p>
            </div>
          </div>
        </Card>

        <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">
          Brand catalogs
        </p>
        <div className="flex flex-col gap-3">
          {MASTER_IMPORT_SOURCES.map((source) => (
            <ImportSourceCard
              key={source.id}
              source={source}
              pendingCount={source.id === 'monster' ? stats?.pendingOfficial : undefined}
            />
          ))}
        </div>
      </div>
    </Layout>
  )
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <Card className={`p-3 text-center ${accent ? 'border-monster-green/30' : ''}`}>
      <p className={`text-2xl font-bold ${accent ? 'text-monster-green' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-monster-muted">{label}</p>
    </Card>
  )
}

function EmptyAccess({ title, description }: { title: string; description: string }) {
  return (
    <Card className="mx-auto max-w-sm p-6 text-center">
      <Lock size={32} className="mx-auto text-monster-muted" />
      <p className="mt-3 font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-monster-muted">{description}</p>
      <Link to="/" className="mt-4 block text-sm text-monster-green hover:underline">
        Back to dashboard
      </Link>
    </Card>
  )
}
