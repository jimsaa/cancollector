import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Database,
  Flag,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  Lock,
  Package,
  ScanLine,
  Shield,
  Upload,
  Users,
} from 'lucide-react'
import { AdminHubNav } from '../components/admin/AdminHubNav'
import { AdminStatCard } from '../components/admin/AdminStatCard'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { getAdminAccessState } from '../lib/adminAuth'
import { fetchAdminDashboard } from '../lib/adminStats'
import { formatPremiumSource } from '../lib/adminUsers'
import { FEEDBACK_STATUS_LABELS, FEEDBACK_TYPE_LABELS } from '../types/feedback'
import type { AdminDashboardData } from '../types/adminStats'

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function collectorLabel(row: { display_name: string | null; username: string | null }): string {
  return row.display_name ?? row.username ?? 'Unknown'
}

function premiumLabel(isPremium: boolean, source: string | null): string {
  if (!isPremium) return 'Free'
  return source ? formatPremiumSource(source) : 'Premium'
}

const QUICK_LINKS = [
  { to: '/admin/feedback', label: 'Feedback Inbox', icon: Inbox },
  { to: '/admin/match-reports', label: 'Match Reports', icon: Flag },
  { to: '/admin/master-catalog', label: 'Master Can Admin', icon: Database },
  { to: '/admin/master-cans', label: 'Scan Queue', icon: ScanLine },
  { to: '/admin/image-review', label: 'Image Review', icon: ImageIcon },
  { to: '/admin/imports', label: 'Official Product Import', icon: Package },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/image-uploader', label: 'Master Image Uploader', icon: Upload },
] as const

export function AdminDashboardPage() {
  const { profile, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
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
      setData(await fetchAdminDashboard())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin stats')
    } finally {
      setLoading(false)
    }
  }, [cloudAdmin])

  useEffect(() => {
    if (cloudAdmin) void load()
  }, [cloudAdmin, load])

  if (authLoading) {
    return (
      <Layout title="Admin Dashboard">
        <LoadingSpinner label="Checking access..." />
      </Layout>
    )
  }

  if (access === 'denied' || !cloudAdmin) {
    return (
      <Layout title="Admin Dashboard">
        <EmptyState
          icon={<Lock size={40} />}
          title="Access denied"
          description="Only admin accounts can view the admin dashboard."
          action={
            <Link to="/profile">
              <Button>Back to profile</Button>
            </Link>
          }
        />
      </Layout>
    )
  }

  const counts = data?.counts

  return (
    <Layout title="Admin Dashboard">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-monster-green" />
            <div>
              <p className="text-sm font-semibold text-white">CanTrove Admin</p>
              <p className="text-xs text-monster-muted">Private stats — admin only</p>
            </div>
          </div>
          <Button variant="secondary" className="py-2 text-xs" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>

        <AdminHubNav />

        <Card className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">Quick links</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.label} to={link.to}>
                  <Button variant="secondary" className="py-2 text-xs">
                    <Icon size={14} />
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </Card>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {loading && !data ? <LoadingSpinner label="Loading admin stats..." /> : null}

        {counts ? (
          <>
            <section>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
                <LayoutDashboard size={14} />
                Overview
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <AdminStatCard label="Total Users" value={counts.totalUsers} />
                <AdminStatCard label="New Users Today" value={counts.newUsersToday} />
                <AdminStatCard label="New Users (7d)" value={counts.newUsersLast7Days} />
                <AdminStatCard label="Total Cans Added" value={counts.totalCans} />
                <AdminStatCard label="Cans Added Today" value={counts.cansAddedToday} />
                <AdminStatCard label="Cans Added (7d)" value={counts.cansAddedLast7Days} />
                <AdminStatCard label="Total Master Cans" value={counts.totalMasterCans} />
                <AdminStatCard label="Pending Suggestions" value={counts.pendingMasterSuggestions} />
                <AdminStatCard label="Pending Image Reviews" value={counts.pendingImageReviews} />
                <AdminStatCard label="Total Feedback" value={counts.totalFeedback} />
                <AdminStatCard label="New Feedback" value={counts.newFeedback} />
                <AdminStatCard label="Active Trade Listings" value={counts.activeTradeListings} />
                <AdminStatCard label="Public Profiles" value={counts.publicProfiles} />
              </div>
            </section>

            {data ? (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
                  Pending admin tasks
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <AdminStatCard
                    label="Pending can suggestions"
                    value={data.pendingTasks.pendingCanSuggestions}
                    hint="Scan queue approvals"
                  />
                  <AdminStatCard
                    label="Pending image reviews"
                    value={data.pendingTasks.pendingImageReviews}
                    hint="Master reference images"
                  />
                  <AdminStatCard
                    label="Unresolved feedback"
                    value={data.pendingTasks.unresolvedFeedback}
                    hint="New, reviewed, or planned"
                  />
                </div>
              </section>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden p-0">
                <p className="border-b border-monster-border px-4 py-3 text-sm font-semibold text-white">
                  Newest users
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-left text-xs">
                    <thead className="bg-monster-dark/60 text-monster-muted">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Premium</th>
                        <th className="px-3 py-2 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.newestUsers.length ? (
                        data.newestUsers.map((row) => (
                          <tr key={row.id} className="border-t border-monster-border/60">
                            <td className="px-3 py-2 text-white">{row.display_name ?? '—'}</td>
                            <td className="px-3 py-2 text-monster-muted">{row.email ?? '—'}</td>
                            <td className="px-3 py-2 text-monster-green">
                              {premiumLabel(row.is_premium, row.premium_source)}
                            </td>
                            <td className="px-3 py-2 text-monster-muted">{formatDate(row.created_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-monster-muted">
                            No users yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="overflow-hidden p-0">
                <p className="border-b border-monster-border px-4 py-3 text-sm font-semibold text-white">
                  Latest added cans
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-left text-xs">
                    <thead className="bg-monster-dark/60 text-monster-muted">
                      <tr>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">Collector</th>
                        <th className="px-3 py-2 font-medium">Barcode</th>
                        <th className="px-3 py-2 font-medium">Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.latestCans.length ? (
                        data.latestCans.map((row) => (
                          <tr key={row.id} className="border-t border-monster-border/60">
                            <td className="px-3 py-2 text-white">{row.name ?? 'Unnamed'}</td>
                            <td className="px-3 py-2 text-monster-muted">{row.user_display_name ?? '—'}</td>
                            <td className="px-3 py-2 font-mono text-monster-muted">{row.barcode ?? '—'}</td>
                            <td className="px-3 py-2 text-monster-muted">{formatDate(row.added_date)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-monster-muted">
                            No cans yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="overflow-hidden p-0 lg:col-span-2">
                <p className="border-b border-monster-border px-4 py-3 text-sm font-semibold text-white">
                  Latest feedback
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-xs">
                    <thead className="bg-monster-dark/60 text-monster-muted">
                      <tr>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Title</th>
                        <th className="px-3 py-2 font-medium">User</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.latestFeedback.length ? (
                        data.latestFeedback.map((row) => (
                          <tr key={row.id} className="border-t border-monster-border/60">
                            <td className="px-3 py-2 text-monster-green">
                              {FEEDBACK_TYPE_LABELS[row.type as keyof typeof FEEDBACK_TYPE_LABELS] ?? row.type}
                            </td>
                            <td className="px-3 py-2 text-white">{row.title}</td>
                            <td className="px-3 py-2 text-monster-muted">
                              {row.display_name ?? row.user_email ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-monster-muted">
                              {FEEDBACK_STATUS_LABELS[row.status as keyof typeof FEEDBACK_STATUS_LABELS] ??
                                row.status}
                            </td>
                            <td className="px-3 py-2 text-monster-muted">{formatDate(row.created_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-monster-muted">
                            No feedback yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <section>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-monster-muted">
                <BarChart3 size={14} />
                Most active collectors
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <Card className="p-3">
                  <p className="mb-2 text-sm font-semibold text-white">By cans collected</p>
                  <ul className="space-y-2 text-xs">
                    {data?.topByCans.length ? (
                      data.topByCans.map((row, i) => (
                        <li key={row.user_id} className="flex justify-between gap-2">
                          <span className="text-monster-muted">
                            {i + 1}. {collectorLabel(row)}
                          </span>
                          <span className="font-semibold tabular-nums text-monster-green">{row.count}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-monster-muted">No data</li>
                    )}
                  </ul>
                </Card>
                <Card className="p-3">
                  <p className="mb-2 text-sm font-semibold text-white">By feedback submitted</p>
                  <ul className="space-y-2 text-xs">
                    {data?.topByFeedback.length ? (
                      data.topByFeedback.map((row, i) => (
                        <li key={row.user_id} className="flex justify-between gap-2">
                          <span className="text-monster-muted">
                            {i + 1}. {collectorLabel(row)}
                          </span>
                          <span className="font-semibold tabular-nums text-monster-green">{row.count}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-monster-muted">No data</li>
                    )}
                  </ul>
                </Card>
                <Card className="p-3">
                  <p className="mb-2 text-sm font-semibold text-white">By trade listings</p>
                  <ul className="space-y-2 text-xs">
                    {data?.topByTradeListings.length ? (
                      data.topByTradeListings.map((row, i) => (
                        <li key={row.user_id} className="flex justify-between gap-2">
                          <span className="text-monster-muted">
                            {i + 1}. {collectorLabel(row)}
                          </span>
                          <span className="font-semibold tabular-nums text-monster-green">{row.count}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-monster-muted">No data</li>
                    )}
                  </ul>
                </Card>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </Layout>
  )
}
