import { useCallback, useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { ArrowLeft, ExternalLink, Inbox, Lock, Shield } from 'lucide-react'

import { AdminHubNav } from '../components/admin/AdminHubNav'

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

  getAdminAccessState,

  getAdminPin,

} from '../lib/adminAuth'

import { fetchAdminFeedback, updateFeedback } from '../lib/feedback'

import type { Feedback, FeedbackPriority, FeedbackStatus, FeedbackType } from '../types/feedback'

import {

  FEEDBACK_PRIORITY_LABELS,

  FEEDBACK_STATUS_LABELS,

  FEEDBACK_TYPE_LABELS,

} from '../types/feedback'



export function AdminFeedbackPage() {

  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()

  const [localAdmin, setLocalAdmin] = useState(false)

  const [pin, setPin] = useState('')

  const [pinError, setPinError] = useState<string | null>(null)

  const [items, setItems] = useState<Feedback[]>([])

  const [loading, setLoading] = useState(false)

  const [selected, setSelected] = useState<Feedback | null>(null)

  const [status, setStatus] = useState<FeedbackStatus>('new')

  const [adminNotes, setAdminNotes] = useState('')

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [success, setSuccess] = useState<string | null>(null)



  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all')

  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all')

  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriority | 'all'>('all')

  const [search, setSearch] = useState('')



  const access = getAdminAccessState({

    loading: authLoading,

    isGuest,

    isConfigured,

    profile,

  })



  const granted = access === 'granted' || (access === 'pin_required' && localAdmin)



  const load = useCallback(async () => {

    if (!granted || !isConfigured) return

    setLoading(true)

    setError(null)

    try {

      setItems(

        await fetchAdminFeedback({

          type: typeFilter,

          status: statusFilter,

          priority: priorityFilter,

          search,

        }),

      )

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to load feedback')

    } finally {

      setLoading(false)

    }

  }, [granted, isConfigured, typeFilter, statusFilter, priorityFilter, search])



  useEffect(() => {

    if (granted) void load()

  }, [granted, load])



  const openDetail = (item: Feedback) => {

    setSelected(item)

    setStatus(item.status)

    setAdminNotes(item.admin_notes ?? '')

    setSuccess(null)

    setError(null)

  }



  const handleSave = async () => {

    if (!selected) return

    setSaving(true)

    setError(null)

    setSuccess(null)

    try {

      const updated = await updateFeedback(selected.id, {

        status,

        admin_notes: adminNotes.trim() || null,

      })

      setSelected(updated)

      setSuccess('Feedback updated.')

      await load()

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Update failed')

    } finally {

      setSaving(false)

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



  if (access === 'loading') {

    return (

      <Layout title="Feedback Inbox">

        <LoadingSpinner label="Checking admin access..." />

      </Layout>

    )

  }



  if (access === 'denied') {

    return (

      <Layout title="Feedback Inbox">

        <Card className="mx-auto max-w-sm p-6 text-center">

          <Shield size={32} className="mx-auto text-monster-muted" />

          <p className="mt-3 font-semibold text-white">Admin access required</p>

          <p className="mt-1 text-sm text-monster-muted">

            Sign in with an admin account or use local admin simulation in guest mode.

          </p>

          <Link to="/" className="mt-4 block text-sm text-monster-green hover:underline">

            Back to dashboard

          </Link>

        </Card>

      </Layout>

    )

  }



  if (access === 'pin_required' && !localAdmin) {

    return (

      <Layout title="Feedback Inbox">

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

            <Lock size={18} />

            Enter Admin

          </Button>

          <p className="mt-3 text-center text-xs text-monster-muted">

            Default PIN: <code className="text-monster-green">{getAdminPin()}</code>

          </p>

        </Card>

      </Layout>

    )

  }



  if (!isConfigured) {

    return (

      <Layout title="Feedback Inbox">

        <Card className="p-4 text-sm text-monster-muted">

          Feedback inbox requires cloud mode with Supabase configured.

        </Card>

      </Layout>

    )

  }



  return (

    <Layout title="Feedback Inbox">

      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between gap-2">

          <Link to="/admin/imports" className="text-sm text-monster-green hover:underline">

            <ArrowLeft size={14} className="mr-1 inline" />

            Admin hub

          </Link>

        </div>



        <AdminHubNav />



        <Card className="grid gap-3 p-4 sm:grid-cols-2">

          <Input

            label="Search"

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            placeholder="Title, message, user..."

          />

          <Select

            label="Type"

            value={typeFilter}

            onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}

          >

            <option value="all">All types</option>

            {(Object.keys(FEEDBACK_TYPE_LABELS) as FeedbackType[]).map((value) => (

              <option key={value} value={value}>

                {FEEDBACK_TYPE_LABELS[value]}

              </option>

            ))}

          </Select>

          <Select

            label="Status"

            value={statusFilter}

            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}

          >

            <option value="all">All statuses</option>

            {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((value) => (

              <option key={value} value={value}>

                {FEEDBACK_STATUS_LABELS[value]}

              </option>

            ))}

          </Select>

          <Select

            label="Priority"

            value={priorityFilter}

            onChange={(e) => setPriorityFilter(e.target.value as FeedbackPriority | 'all')}

          >

            <option value="all">All priorities</option>

            {(Object.keys(FEEDBACK_PRIORITY_LABELS) as FeedbackPriority[]).map((value) => (

              <option key={value} value={value}>

                {FEEDBACK_PRIORITY_LABELS[value]}

              </option>

            ))}

          </Select>

        </Card>



        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {success ? <p className="text-sm text-monster-green">{success}</p> : null}

        {loading ? <LoadingSpinner label="Loading feedback..." /> : null}



        {!loading && items.length === 0 ? (

          <EmptyState

            icon={<Inbox size={40} />}

            title="Inbox is empty"

            description="No feedback matches your filters."

          />

        ) : null}



        {!loading

          ? items.map((item) => (

              <Card

                key={item.id}

                className={`cursor-pointer p-4 transition-colors hover:border-monster-green/40 ${

                  selected?.id === item.id ? 'border-monster-green/50' : ''

                }`}

                onClick={() => openDetail(item)}

              >

                <div className="flex items-start justify-between gap-2">

                  <div className="min-w-0">

                    <p className="font-semibold text-white">{item.title}</p>

                    <p className="mt-0.5 text-xs text-monster-muted">

                      {FEEDBACK_TYPE_LABELS[item.type]} · {FEEDBACK_PRIORITY_LABELS[item.priority]} ·{' '}

                      {FEEDBACK_STATUS_LABELS[item.status]}

                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-monster-muted">{item.message}</p>

                    <p className="mt-2 text-[10px] text-monster-muted">

                      {item.display_name ?? 'User'} · {new Date(item.created_at).toLocaleString()}

                    </p>

                  </div>

                  {item.status === 'new' ? (

                    <span className="shrink-0 rounded-full bg-monster-green px-2 py-0.5 text-[10px] font-bold text-black">

                      NEW

                    </span>

                  ) : null}

                </div>

              </Card>

            ))

          : null}



        {selected ? (

          <Card className="fixed inset-x-4 bottom-20 z-50 max-h-[75vh] overflow-y-auto border-monster-green/40 p-4 shadow-xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2">

            <p className="font-semibold text-white">{selected.title}</p>

            <p className="mt-1 text-xs text-monster-muted">

              {selected.display_name ?? 'User'}

              {selected.user_email ? ` · ${selected.user_email}` : ''}

            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm text-white">{selected.message}</p>



            {selected.screenshot_url ? (

              <a

                href={selected.screenshot_url}

                target="_blank"

                rel="noopener noreferrer"

                className="mt-3 inline-flex items-center gap-1 text-xs text-monster-green hover:underline"

              >

                View screenshot

                <ExternalLink size={12} />

              </a>

            ) : null}



            {selected.current_url ? (

              <p className="mt-2 break-all text-[10px] text-monster-muted">

                Page: {selected.current_url}

              </p>

            ) : null}



            <div className="mt-4 flex flex-col gap-3">

              <Select

                label="Status"

                value={status}

                onChange={(e) => setStatus(e.target.value as FeedbackStatus)}

              >

                {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((value) => (

                  <option key={value} value={value}>

                    {FEEDBACK_STATUS_LABELS[value]}

                  </option>

                ))}

              </Select>



              <label className="flex flex-col gap-1.5">

                <span className="text-xs font-semibold uppercase tracking-wide text-monster-muted">

                  Admin notes

                </span>

                <textarea

                  value={adminNotes}

                  onChange={(e) => setAdminNotes(e.target.value)}

                  rows={3}

                  className="rounded-xl border border-monster-border bg-monster-dark px-4 py-3 text-sm text-white focus:border-monster-green focus:outline-none"

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

          </Card>

        ) : null}

      </div>

    </Layout>

  )

}


