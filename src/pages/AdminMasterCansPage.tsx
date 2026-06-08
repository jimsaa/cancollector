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
  findPossibleMasterMatchesForSuggestion,
  linkPendingSuggestionToMaster,
  rejectPendingSuggestion,
  type ApproveSuggestionInput,
} from '../lib/pendingSuggestions'
import type { MasterCanProductMatch } from '../lib/masterCanProductMatch'
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
  const [possibleMatches, setPossibleMatches] = useState<MasterCanProductMatch[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
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
    setPossibleMatches([])
    setMatchesLoading(true)
    void findPossibleMasterMatchesForSuggestion(suggestion)
      .then(setPossibleMatches)
      .catch(() => setPossibleMatches([]))
      .finally(() => setMatchesLoading(false))
  }

  const handleLinkToMatch = async (masterId: string) => {
    if (!editing) return
    setActionId(editing.id)
    setError(null)
    setSuccess(null)
    try {
      const result = await linkPendingSuggestionToMaster(editing, masterId, 'user_scan')
      setSuccess(
        `Barcode linked to existing master can. ${result.linkedCans} user can${result.linkedCans === 1 ? '' : 's'} updated.`,
      )
      setEditing(null)
      setForm(null)
      setPossibleMatches([])
      await load()
    } catch (err) {
      setError(formatMasterCanError(err, 'Link failed'))
    } finally {
      setActionId(null)
    }
  }

  const handleAttachBarcodeSuggestion = async (suggestion: PendingCanSuggestion) => {
    if (!suggestion.suggested_master_can_id) return
    setActionId(suggestion.id)
    setError(null)
    setSuccess(null)
    try {
      const result = await linkPendingSuggestionToMaster(
        suggestion,
        suggestion.suggested_master_can_id,
        'user_scan',
      )
      setSuccess(
        `Barcode attached to master can. ${result.linkedCans} user can${result.linkedCans === 1 ? '' : 's'} updated.`,
      )
      await load()
    } catch (err) {
      setError(formatMasterCanError(err, 'Attach barcode failed'))
    } finally {
      setActionId(null)
    }
  }

  const handleApprove = async () => {
    if (!editing || !form) return
    setActionId(editing.id)
    setError(null)
    setSuccess(null)
    try {
      if (
        editing.suggestion_type === 'attach_barcode' &&
        editing.suggested_master_can_id
      ) {
        const result = await linkPendingSuggestionToMaster(
          editing,
          editing.suggested_master_can_id,
          'user_scan',
        )
        setSuccess(
          `Barcode attached to master can. ${result.linkedCans} user can${result.linkedCans === 1 ? '' : 's'} updated.`,
        )
        setEditing(null)
        setForm(null)
        await load()
        return
      }

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
                    {suggestion.suggestion_type === 'attach_barcode' ? (
                      <p className="mt-1 text-xs text-yellow-400">
                        Attach scanned barcode to existing master can
                      </p>
                    ) : suggestion.barcode ? (
                      <SuggestionPossibleMatchHint suggestion={suggestion} />
                    ) : null}
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
                    loading={actionId === suggestion.id}
                    onClick={() =>
                      suggestion.suggestion_type === 'attach_barcode' &&
                      suggestion.suggested_master_can_id
                        ? void handleAttachBarcodeSuggestion(suggestion)
                        : openEdit(suggestion)
                    }
                    disabled={actionId === suggestion.id}
                  >
                    <Check size={14} />
                    {suggestion.suggestion_type === 'attach_barcode'
                      ? 'Attach barcode'
                      : 'Approve'}
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
            setPossibleMatches([])
          }}
          onApprove={() => void handleApprove()}
        >
          {form ? (
            <>
              {matchesLoading ? (
                <p className="text-xs text-monster-muted">Checking for catalog matches...</p>
              ) : null}
              {!matchesLoading && possibleMatches.length > 0 ? (
                <Card className="border-yellow-600/40 bg-yellow-900/20 p-3">
                  <p className="text-sm font-semibold text-yellow-200">Possible match found</p>
                  <p className="mt-1 text-xs text-yellow-100/80">
                    This scan may belong to an official catalog product without a barcode yet.
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {possibleMatches.map((match) => (
                      <div
                        key={match.master.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-yellow-600/30 bg-black/20 p-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{match.master.product_name}</p>
                          <p className="text-[10px] text-monster-muted">
                            {match.reason} · {Math.round(match.score * 100)}% match
                          </p>
                        </div>
                        <Button
                          className="shrink-0 py-1.5 text-xs"
                          loading={Boolean(editing && actionId === editing.id)}
                          onClick={() => void handleLinkToMatch(match.master.id)}
                        >
                          Link barcode
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
              <AdminApproveFormFields
                form={form}
                onChange={setForm}
                showSourceUrl={false}
                imageSourceNote="Link to an existing catalog product above, or approve as a new master can below."
              />
            </>
          ) : null}
        </AdminApproveModal>
      </div>
    </Layout>
  )
}

function SuggestionPossibleMatchHint({ suggestion }: { suggestion: PendingCanSuggestion }) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void findPossibleMasterMatchesForSuggestion(suggestion)
      .then((matches) => {
        if (!active || !matches.length) return
        setLabel(matches[0].master.product_name)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [suggestion])

  if (!label) return null
  return <p className="mt-1 text-xs text-yellow-400">Possible catalog match: {label}</p>
}
