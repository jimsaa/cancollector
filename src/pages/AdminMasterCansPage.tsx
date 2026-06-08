import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Check, X, Pencil, Lock } from 'lucide-react'
import { AdminApproveFormFields } from '../components/admin/AdminApproveFormFields'
import { AdminApproveModal } from '../components/admin/AdminApproveModal'
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
  getAdminPin,
} from '../lib/adminAuth'
import {
  approvePendingSuggestion,
  buildApproveInputFromSuggestion,
  fetchPendingSuggestions,
  rejectPendingSuggestion,
  type ApproveSuggestionInput,
} from '../lib/pendingSuggestions'
import { formatApproveSuggestionMessage } from '../lib/approveSuggestionMessages'
import { formatMasterCanError } from '../lib/masterCanSupabase'
import type { PendingCanSuggestion } from '../types/pendingSuggestion'

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
      const pending = await fetchPendingSuggestions('pending')
      setSuggestions(pending.filter((row) => row.source !== 'official_site'))
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
    setForm(buildApproveInputFromSuggestion(suggestion))
  }

  const handleApprove = async () => {
    if (!editing || !form) return
    setActionId(editing.id)
    setError(null)
    setSuccess(null)
    try {
      const result = await approvePendingSuggestion(editing, form)
      setSuccess(formatApproveSuggestionMessage(result))
      setEditing(null)
      setForm(null)
      await load()
    } catch (err) {
      setError(formatMasterCanError(err, 'Approve failed'))
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
          <div>
            <p className="text-sm text-monster-muted">
              Review pending suggestions. Only admins can add approved cans to the master database.
            </p>
            <Link
              to="/admin/imports"
              className="mt-1 inline-block text-xs text-monster-green hover:underline"
            >
              Admin hub
            </Link>
          </div>
        </div>

        <AdminHubNav
          showExit={access === 'pin_required'}
          onExit={() => {
            clearLocalAdminSession()
            setLocalAdmin(false)
          }}
        />

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
                    {suggestion.barcode ? (
                      <p className="font-mono text-xs text-monster-green">{suggestion.barcode}</p>
                    ) : (
                      <p className="text-xs text-monster-muted">No barcode yet</p>
                    )}
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

        <AdminApproveModal
          open={Boolean(editing && form)}
          title="Edit before approval"
          approveLabel="Approve to master_cans"
          approving={Boolean(editing && actionId === editing.id)}
          onClose={() => {
            setEditing(null)
            setForm(null)
          }}
          onApprove={() => void handleApprove()}
        >
          {form ? (
            <AdminApproveFormFields
              form={form}
              onChange={setForm}
              showSourceUrl={false}
              imageSourceNote="Official product images are external references. Do not re-host unless you have permission."
            />
          ) : null}
        </AdminApproveModal>
      </div>
    </Layout>
  )
}
