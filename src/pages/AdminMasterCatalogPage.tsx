import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Barcode, Lock, Shield } from 'lucide-react'
import { AdminAttachBarcodeModal } from '../components/admin/AdminAttachBarcodeModal'
import { AdminHubNav } from '../components/admin/AdminHubNav'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import {
  activateLocalAdminSession,
  clearLocalAdminSession,
  getAdminAccessState,
} from '../lib/adminAuth'
import { attachBarcodeToMasterCan } from '../lib/pendingSuggestions'
import { fetchActiveMasterCans } from '../lib/masterCans'
import { formatMasterCanError } from '../lib/masterCanSupabase'
import { isBarcodelessMaster } from '../lib/masterCanProductMatch'
import type { MasterBarcodeSource, MasterCan } from '../types/masterCan'

export function AdminMasterCatalogPage() {
  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [localAdmin, setLocalAdmin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [masters, setMasters] = useState<MasterCan[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [attachTarget, setAttachTarget] = useState<MasterCan | null>(null)
  const [attachSaving, setAttachSaving] = useState(false)
  const [attachError, setAttachError] = useState<string | null>(null)

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
      const rows = await fetchActiveMasterCans('all')
      setMasters(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load master cans')
    } finally {
      setLoading(false)
    }
  }, [granted])

  useEffect(() => {
    if (granted) void load()
  }, [granted, load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return masters
    return masters.filter((row) => {
      const haystack = [
        row.product_name,
        row.brand,
        row.flavor,
        row.category,
        row.barcode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [masters, query])

  const withoutBarcode = filtered.filter(isBarcodelessMaster)

  const handleAttach = async (barcode: string, source: MasterBarcodeSource) => {
    if (!attachTarget) return
    setAttachSaving(true)
    setAttachError(null)
    setSuccess(null)
    try {
      await attachBarcodeToMasterCan(attachTarget.id, barcode, source)
      setSuccess(`Barcode attached to ${attachTarget.product_name}`)
      setAttachTarget(null)
      await load()
    } catch (err) {
      setAttachError(formatMasterCanError(err, 'Attach failed'))
    } finally {
      setAttachSaving(false)
    }
  }

  const handleLocalLogin = () => {
    if (activateLocalAdminSession(pin)) {
      setLocalAdmin(true)
      setPinError(null)
    } else {
      setPinError('Invalid admin PIN')
    }
  }

  if (authLoading) {
    return (
      <Layout title="Master Catalog">
        <LoadingSpinner label="Checking access..." />
      </Layout>
    )
  }

  if (access === 'denied') {
    return (
      <Layout title="Master Catalog">
        <EmptyState
          icon={<Lock size={40} />}
          title="Access denied"
          description="Only admin accounts can manage the master catalog."
          action={
            <Link to="/">
              <Button variant="secondary">Back to app</Button>
            </Link>
          }
        />
      </Layout>
    )
  }

  if (access === 'pin_required' && !localAdmin) {
    return (
      <Layout title="Master Catalog">
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
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Master Catalog">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Browse approved master cans. Official imports without barcodes can be linked when users scan
          matching products.
        </p>

        <AdminHubNav
          showExit={access === 'pin_required'}
          onExit={() => {
            clearLocalAdminSession()
            setLocalAdmin(false)
          }}
        />

        <Input
          label="Search catalog"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Product name, brand, barcode..."
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-monster-green">{success}</p> : null}

        {loading ? (
          <LoadingSpinner label="Loading master cans..." />
        ) : (
          <>
            <p className="text-xs text-monster-muted">
              {filtered.length} shown · {withoutBarcode.length} without barcode
            </p>
            <div className="flex flex-col gap-3">
              {filtered.map((row) => (
                <Card key={row.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-monster-dark">
                      {row.reference_image_url || row.image_url ? (
                        <img
                          src={row.reference_image_url ?? row.image_url ?? ''}
                          alt=""
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-monster-muted">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{row.product_name}</p>
                      <p className="text-xs text-monster-muted">
                        {row.brand}
                        {row.flavor ? ` · ${row.flavor}` : ''}
                      </p>
                      {row.barcode ? (
                        <p className="mt-1 font-mono text-xs text-monster-green">{row.barcode}</p>
                      ) : (
                        <p className="mt-1 text-xs text-yellow-400">No barcode yet</p>
                      )}
                    </div>
                  </div>
                  {!row.barcode ? (
                    <Button
                      variant="secondary"
                      className="mt-3 w-full py-2 text-xs"
                      onClick={() => {
                        setAttachError(null)
                        setAttachTarget(row)
                      }}
                    >
                      <Barcode size={14} />
                      Attach barcode
                    </Button>
                  ) : null}
                </Card>
              ))}
            </div>
          </>
        )}

        <AdminAttachBarcodeModal
          open={Boolean(attachTarget)}
          master={attachTarget}
          saving={attachSaving}
          error={attachError}
          onClose={() => setAttachTarget(null)}
          onSave={(barcode, source) => void handleAttach(barcode, source)}
        />
      </div>
    </Layout>
  )
}
