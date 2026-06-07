import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ExternalLink, Lock, LogOut, Pencil, RefreshCw, Shield, X } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import {
  activateLocalAdminSession,
  clearLocalAdminSession,
  getAdminAccessState,
  getAdminPin,
} from '../lib/adminAuth'
import {
  fetchOfficialImportFile,
  fetchOfficialImportPending,
  syncOfficialProductsToPendingQueue,
} from '../lib/officialProductImport'
import {
  approvePendingSuggestion,
  rejectPendingSuggestion,
  type ApproveSuggestionInput,
} from '../lib/pendingSuggestions'
import type { OfficialProductImportFile } from '../types/officialProductImport'
import type { PendingCanSuggestion } from '../types/pendingSuggestion'
import type { Rarity } from '../types/can'

export function AdminMonsterProductsImportPage() {
  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [localAdmin, setLocalAdmin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<OfficialProductImportFile | null>(null)
  const [suggestions, setSuggestions] = useState<PendingCanSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [editing, setEditing] = useState<PendingCanSuggestion | null>(null)
  const [form, setForm] = useState<ApproveSuggestionInput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      const [file, pending] = await Promise.all([
        fetchOfficialImportFile(),
        fetchOfficialImportPending(),
      ])
      setImportFile(file)
      setSuggestions(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load import data')
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

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await syncOfficialProductsToPendingQueue()
      setSuccess(
        `Synced ${result.imported} new product${result.imported === 1 ? '' : 's'} to pending queue (${result.skipped} skipped as duplicates).`,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const openEdit = (suggestion: PendingCanSuggestion) => {
    setEditing(suggestion)
    setForm({
      brand: suggestion.brand ?? 'Monster Energy',
      product_name: suggestion.product_name ?? '',
      flavor: suggestion.flavor ?? '',
      variant_name: suggestion.variant_name ?? suggestion.flavor ?? '',
      volume: suggestion.volume ?? '',
      country: suggestion.country ?? 'US',
      category: suggestion.category ?? '',
      barcode: suggestion.barcode ?? '',
      reference_image_url: suggestion.image_url,
      image_url: suggestion.image_url,
      image_source: 'official_site',
      source: 'official_site',
      source_url: suggestion.source_url ?? suggestion.product_page_url ?? '',
      rarity: 'unknown',
      release_year: null,
      discontinued: false,
    })
  }

  const handleApprove = async () => {
    if (!editing || !form) return
    setActionId(editing.id)
    setError(null)
    setSuccess(null)
    try {
      const result = await approvePendingSuggestion(editing, form)
      setSuccess(
        `Approved "${result.master.product_name}" into master_cans.${result.linkedCans > 0 ? ` Linked ${result.linkedCans} user can(s).` : ''}`,
      )
      setEditing(null)
      setForm(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (suggestion: PendingCanSuggestion) => {
    setActionId(suggestion.id)
    setError(null)
    setSuccess(null)
    try {
      await rejectPendingSuggestion(suggestion.id)
      setSuccess('Import rejected.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setActionId(null)
    }
  }

  if (authLoading) {
    return (
      <Layout title="Official Import">
        <LoadingSpinner label="Checking access..." />
      </Layout>
    )
  }

  if (access === 'denied') {
    return (
      <Layout title="Official Import">
        <EmptyState
          icon={<Lock size={40} />}
          title="Access denied"
          description="Only admin accounts can review official product imports."
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
      <Layout title="Official Import">
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
    <Layout title="Official Product Import">
      <div className="flex flex-col gap-4">
        <Card className="border-yellow-600/30 bg-yellow-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
            <p className="text-xs text-yellow-100/90">
              Official product images are external references. Do not re-host unless you have
              permission.
            </p>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-monster-muted">
              Review scraper output from the official Monster Energy product catalog. Approve into{' '}
              <code className="text-monster-green">master_cans</code> or reject.
            </p>
            {importFile ? (
              <p className="mt-1 text-xs text-monster-muted">
                JSON: {importFile.product_count} products · scraped{' '}
                {new Date(importFile.scraped_at).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Link to="/admin/imports">
              <Button variant="secondary" className="py-2 text-xs">
                All imports
              </Button>
            </Link>
            <Link to="/admin/master-cans">
              <Button variant="secondary" className="py-2 text-xs">
                Scan queue
              </Button>
            </Link>
            {access === 'pin_required' ? (
              <button
                type="button"
                onClick={() => {
                  clearLocalAdminSession()
                  setLocalAdmin(false)
                }}
                className="flex items-center gap-1 text-xs text-monster-muted hover:text-white"
              >
                <LogOut size={14} />
                Exit
              </button>
            ) : null}
          </div>
        </div>

        <Card className="p-4">
          <p className="text-sm font-semibold text-white">Import pipeline</p>
          <p className="mt-1 text-xs text-monster-muted">
            1) Run <code className="text-monster-green">npm run import:monster-products</code> · 2)
            Sync to pending queue · 3) Review &amp; approve
          </p>
          <Button className="mt-3 py-2 text-xs" loading={syncing} onClick={() => void handleSync()}>
            <RefreshCw size={14} />
            Sync JSON to pending queue
          </Button>
        </Card>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-monster-green">{success}</p> : null}

        {loading ? (
          <LoadingSpinner label="Loading official imports..." />
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={<Shield size={40} />}
            title="No pending official imports"
            description="Run the scraper and sync JSON to populate the review queue."
            action={
              <Button onClick={() => void handleSync()} loading={syncing}>
                Sync now
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-monster-muted">{suggestions.length} pending official imports</p>
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="p-4">
                <div className="flex gap-3">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-monster-dark">
                    {suggestion.image_url ? (
                      <img
                        src={suggestion.image_url}
                        alt=""
                        className="h-full w-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-monster-muted">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">
                      {suggestion.product_name ?? 'Unknown product'}
                    </p>
                    <p className="text-xs text-monster-muted">
                      {suggestion.brand ?? 'Monster Energy'}
                      {suggestion.category ? ` · ${suggestion.category}` : ''}
                      {suggestion.flavor ? ` · ${suggestion.flavor}` : ''}
                    </p>
                    {suggestion.product_page_url ? (
                      <a
                        href={suggestion.product_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-monster-green hover:underline"
                      >
                        Product page
                        <ExternalLink size={12} />
                      </a>
                    ) : null}
                    <p className="mt-1 text-[10px] text-monster-muted">
                      Source: {suggestion.source} ·{' '}
                      {new Date(suggestion.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    className="py-2 text-xs"
                    onClick={() => openEdit(suggestion)}
                    disabled={actionId === suggestion.id}
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    className="py-2 text-xs"
                    onClick={() => openEdit(suggestion)}
                    disabled={actionId === suggestion.id}
                  >
                    <Check size={14} />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    className="py-2 text-xs"
                    loading={actionId === suggestion.id}
                    onClick={() => void handleReject(suggestion)}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {editing && form ? (
          <Card className="fixed inset-x-4 bottom-4 z-50 max-h-[80vh] overflow-y-auto border-monster-green/40 p-4 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2">
            <p className="mb-3 font-semibold text-white">Edit before approval</p>
            <div className="flex flex-col gap-3">
              <Input
                label="Product name"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              />
              <Input
                label="Brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                label="Category"
                value={form.category ?? ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                label="Flavor / variant"
                value={form.flavor ?? ''}
                onChange={(e) => setForm({ ...form, flavor: e.target.value, variant_name: e.target.value })}
              />
              <Input
                label="Volume"
                value={form.volume ?? ''}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
              />
              <Input
                label="Country"
                value={form.country ?? ''}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
              <Select
                label="Rarity"
                value={form.rarity ?? 'unknown'}
                onChange={(e) => setForm({ ...form, rarity: e.target.value as Rarity })}
              >
                <option value="unknown">Unknown</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
              </Select>
              <Input
                label="Barcode (optional)"
                value={form.barcode ?? ''}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Add later if unknown"
              />
              <Input
                label="Reference image URL (external)"
                value={form.reference_image_url ?? form.image_url ?? ''}
                onChange={(e) =>
                  setForm({ ...form, reference_image_url: e.target.value, image_url: e.target.value })
                }
                placeholder="https://..."
              />
              <Select
                label="Reference image source"
                value={form.image_source ?? 'official_site'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    image_source: e.target.value as ApproveSuggestionInput['image_source'],
                  })
                }
              >
                <option value="official_site">Official site</option>
                <option value="manual">Manual</option>
                <option value="open_food_facts">Open Food Facts</option>
                <option value="seed">Seed</option>
                <option value="placeholder">Placeholder</option>
              </Select>
              <Input
                label="Source URL"
                value={form.source_url ?? ''}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={form.discontinued ?? false}
                  onChange={(e) => setForm({ ...form, discontinued: e.target.checked })}
                  className="accent-monster-green"
                />
                Discontinued
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => { setEditing(null); setForm(null) }}>
                Cancel
              </Button>
              <Button loading={actionId === editing.id} onClick={() => void handleApprove()}>
                Approve to master_cans
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </Layout>
  )
}
