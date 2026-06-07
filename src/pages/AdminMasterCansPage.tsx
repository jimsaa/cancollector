import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Check, X, Pencil, LogOut, Lock } from 'lucide-react'
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
  approvePendingSuggestion,
  fetchPendingSuggestions,
  rejectPendingSuggestion,
  type ApproveSuggestionInput,
} from '../lib/pendingSuggestions'
import type { PendingCanSuggestion } from '../types/pendingSuggestion'
import type { Rarity } from '../types/can'

export function AdminMasterCansPage() {
  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [localAdmin, setLocalAdmin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PendingCanSuggestion[]>([])
  const [loading, setLoading] = useState(false)
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
      setSuggestions(await fetchPendingSuggestions('pending'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
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

  const openEdit = (suggestion: PendingCanSuggestion) => {
    setEditing(suggestion)
    setForm({
      brand: 'Monster',
      product_name: suggestion.product_name ?? '',
      flavor: '',
      variant_name: '',
      volume: '',
      country: '',
      barcode: suggestion.barcode,
      image_url: suggestion.image_url,
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
        `Approved "${result.master.product_name}". Linked ${result.linkedCans} user can${result.linkedCans === 1 ? '' : 's'}.`,
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
      setSuccess('Suggestion rejected. User cans remain in private collections.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setActionId(null)
    }
  }

  if (authLoading) {
    return (
      <Layout title="Admin">
        <LoadingSpinner label="Checking access..." />
      </Layout>
    )
  }

  if (access === 'denied') {
    return (
      <Layout title="Admin">
        <EmptyState
          icon={<Lock size={40} />}
          title="Access denied"
          description="Only admin accounts can review master can suggestions. Contact an administrator if you need access."
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
      <Layout title="Admin">
        <Card className="mx-auto max-w-sm p-4">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={20} className="text-monster-green" />
            <p className="font-semibold text-white">Local Admin Simulation</p>
          </div>
          <p className="mb-4 text-sm text-monster-muted">
            Local Mode uses a test PIN to simulate admin approval. Default PIN:{' '}
            <code className="text-monster-green">{getAdminPin()}</code>
          </p>
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
          <Link to="/" className="mt-3 block text-center text-xs text-monster-muted hover:text-white">
            Back to app
          </Link>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Master Can Admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-monster-muted">
            Review pending suggestions. Only admins can add approved cans to the master database.
          </p>
          {access === 'pin_required' ? (
            <button
              type="button"
              onClick={() => {
                clearLocalAdminSession()
                setLocalAdmin(false)
              }}
              className="flex shrink-0 items-center gap-1 text-xs text-monster-muted hover:text-white"
            >
              <LogOut size={14} />
              Exit
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-monster-green">{success}</p> : null}

        {loading ? (
          <LoadingSpinner label="Loading pending suggestions..." />
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={<Shield size={40} />}
            title="No pending suggestions"
            description="Unknown barcodes from the add-can wizard appear here for approval."
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-monster-muted">{suggestions.length} pending</p>
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="p-4">
                <div className="flex gap-3">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-monster-dark">
                    {suggestion.image_url ? (
                      <img
                        src={suggestion.image_url}
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
                    <p className="font-semibold text-white">
                      {suggestion.product_name ?? 'Unknown product'}
                    </p>
                    <p className="font-mono text-xs text-monster-green">{suggestion.barcode}</p>
                    <p className="mt-1 text-xs text-monster-muted">
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
                label="Flavor"
                value={form.flavor ?? ''}
                onChange={(e) => setForm({ ...form, flavor: e.target.value })}
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
                label="Barcode"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
              <Input
                label="Image URL (replace image)"
                value={form.image_url ?? ''}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
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
                Approve
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </Layout>
  )
}
