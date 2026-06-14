import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, Lock } from 'lucide-react'
import { AdminHubNav } from '../components/admin/AdminHubNav'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { getAdminAccessState } from '../lib/adminAuth'
import {
  fetchAdminMatchReports,
  updateMatchReport,
} from '../lib/matchReports'
import { fetchMasterCanById } from '../lib/masterCans'
import { MATCH_REPORT_STATUS_LABELS, type MatchReport, type MatchReportStatus } from '../types/matchReport'
import type { MasterCan } from '../types/masterCan'

export function AdminMatchReportsPage() {
  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [items, setItems] = useState<MatchReport[]>([])
  const [masters, setMasters] = useState<Record<string, MasterCan>>({})
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<MatchReport | null>(null)
  const [status, setStatus] = useState<MatchReportStatus>('new')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const access = getAdminAccessState({
    loading: authLoading,
    isGuest,
    isConfigured,
    profile,
  })
  const cloudAdmin = isConfigured && !isGuest && profile?.role === 'admin'

  const load = useCallback(async () => {
    if (!cloudAdmin) return
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchAdminMatchReports()
      setItems(rows)
      const ids = [
        ...new Set(
          rows.flatMap((r) => [r.matched_master_can_id, r.suggested_master_can_id].filter(Boolean)),
        ),
      ] as string[]
      const loaded: Record<string, MasterCan> = {}
      await Promise.all(
        ids.map(async (id) => {
          const m = await fetchMasterCanById(id)
          if (m) loaded[id] = m
        }),
      )
      setMasters(loaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [cloudAdmin])

  useEffect(() => {
    if (cloudAdmin) void load()
  }, [cloudAdmin, load])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      await updateMatchReport(selected.id, { status, admin_notes: adminNotes.trim() || null })
      setSelected(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <Layout title="Match Reports">
        <LoadingSpinner label="Checking access..." />
      </Layout>
    )
  }

  if (access === 'denied' || !cloudAdmin) {
    return (
      <Layout title="Match Reports">
        <EmptyState
          icon={<Lock size={40} />}
          title="Access denied"
          description="Only admin accounts can review match reports."
          action={
            <Link to="/admin">
              <Button>Admin dashboard</Button>
            </Link>
          }
        />
      </Layout>
    )
  }

  return (
    <Layout title="Match Reports">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <Flag size={20} className="mt-0.5 text-monster-green" />
          <p className="text-sm text-monster-muted">
            Collectors report incorrect barcode or name matches. Approve to prioritize corrections, or
            dismiss false alarms.
          </p>
        </div>

        <AdminHubNav />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {loading ? <LoadingSpinner label="Loading reports..." /> : null}

        <div className="flex flex-col gap-2">
          {items.map((row) => (
            <Card
              key={row.id}
              className="cursor-pointer p-3 hover:border-monster-green/40"
              onClick={() => {
                setSelected(row)
                setStatus(row.status)
                setAdminNotes(row.admin_notes ?? '')
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm text-monster-green">{row.barcode}</p>
                  <p className="text-xs text-monster-muted">
                    {row.off_product_name ?? 'Unknown product'}
                  </p>
                  <p className="mt-1 text-xs text-white">
                    Reported match:{' '}
                    {row.matched_master_can_id
                      ? masters[row.matched_master_can_id]?.product_name ?? row.matched_master_can_id
                      : row.suggested_master_can_id
                        ? `Possible: ${masters[row.suggested_master_can_id]?.product_name ?? '—'}`
                        : '—'}
                  </p>
                </div>
                <span className="rounded-full bg-monster-dark px-2 py-0.5 text-[10px] uppercase text-monster-muted">
                  {MATCH_REPORT_STATUS_LABELS[row.status]}
                </span>
              </div>
            </Card>
          ))}
          {!loading && items.length === 0 ? (
            <p className="text-sm text-monster-muted">No match reports yet.</p>
          ) : null}
        </div>

        {selected ? (
          <div
            className="fixed inset-x-4 z-50 mx-auto max-w-lg"
            style={{
              bottom: 'max(5.25rem, calc(env(safe-area-inset-bottom, 0px) + 5.25rem))',
              maxHeight: 'min(70dvh, calc(100dvh - 8rem))',
            }}
          >
            <Card className="max-h-full overflow-y-auto border-monster-green/30 p-4 shadow-xl">
            <p className="font-semibold text-white">Review report</p>
            <p className="mt-1 font-mono text-xs text-monster-green">{selected.barcode}</p>
            {selected.comment ? (
              <p className="mt-2 text-sm text-monster-muted">{selected.comment}</p>
            ) : null}
            <div className="mt-3">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchReportStatus)}
              >
                {Object.entries(MATCH_REPORT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-monster-muted">
                  Admin notes
                </span>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-monster-border bg-monster-dark px-4 py-3 text-sm text-white"
                />
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button loading={saving} onClick={() => void handleSave()}>
                Save
              </Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
            <Link to="/admin/master-catalog" className="mt-3 block text-center text-xs text-monster-green">
              Open Master Catalog to correct barcode
            </Link>
            </Card>
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
