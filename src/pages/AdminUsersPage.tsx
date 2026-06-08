import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, ExternalLink, Lock, Shield, UserCog, Users } from 'lucide-react'
import { AdminGrantPremiumModal } from '../components/admin/AdminGrantPremiumModal'
import { AdminHubNav } from '../components/admin/AdminHubNav'
import { PremiumBadge } from '../components/profile/PremiumBadge'
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
import {
  fetchAdminUsers,
  fetchRecentAdminActions,
  formatPremiumSource,
  grantPremium,
  isPremiumExpired,
  removePremium,
  setUserRole,
} from '../lib/adminUsers'
import { grantManualBadge, getBadgeFromCatalog } from '../lib/badges'
import { MANUAL_GRANT_BADGE_IDS } from '../types/badge'
import { isPremiumActive } from '../lib/premium'
import type { AdminAction, AdminUserRow } from '../types/premium'
import type { PremiumSource } from '../types/premium'

export function AdminUsersPage() {
  const { profile, user, loading: authLoading, isGuest, isConfigured } = useAuth()
  const [localAdmin, setLocalAdmin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [actions, setActions] = useState<AdminAction[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [grantTarget, setGrantTarget] = useState<AdminUserRow | null>(null)
  const [grantSaving, setGrantSaving] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const access = getAdminAccessState({
    loading: authLoading,
    isGuest,
    isConfigured,
    profile,
  })

  const granted = access === 'granted' || (access === 'pin_required' && localAdmin)
  const cloudAdmin = isConfigured && !isGuest && profile?.role === 'admin'

  const load = useCallback(async () => {
    if (!granted || !cloudAdmin) return
    setLoading(true)
    setError(null)
    try {
      const [userRows, actionRows] = await Promise.all([
        fetchAdminUsers(),
        fetchRecentAdminActions(15),
      ])
      setUsers(userRows)
      setActions(actionRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [granted, cloudAdmin])

  useEffect(() => {
    if (granted && cloudAdmin) void load()
  }, [granted, cloudAdmin, load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((row) => {
      const haystack = [row.username, row.display_name, row.email, row.role, row.premium_source]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [users, query])

  const handleGrant = async (input: {
    lifetime: boolean
    expiresAt: string | null
    premiumSource: PremiumSource
    notes: string | null
  }) => {
    if (!user || !grantTarget) return
    setGrantSaving(true)
    setGrantError(null)
    setSuccess(null)
    try {
      await grantPremium(user.id, {
        targetUserId: grantTarget.id,
        ...input,
      })
      setSuccess(`Premium granted to ${grantTarget.username ?? grantTarget.display_name ?? 'user'}`)
      setGrantTarget(null)
      await load()
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : 'Grant failed')
    } finally {
      setGrantSaving(false)
    }
  }

  const runAction = async (targetId: string, fn: () => Promise<void>, message: string) => {
    setActionLoadingId(targetId)
    setSuccess(null)
    setError(null)
    try {
      await fn()
      setSuccess(message)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoadingId(null)
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
      <Layout title="User Management">
        <LoadingSpinner label="Checking access..." />
      </Layout>
    )
  }

  if (access === 'denied') {
    return (
      <Layout title="User Management">
        <EmptyState
          icon={<Lock size={40} />}
          title="Access denied"
          description="Only admin accounts can manage users."
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
      <Layout title="User Management">
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

  if (!cloudAdmin) {
    return (
      <Layout title="User Management">
        <AdminHubNav showExit={access === 'pin_required'} onExit={() => {
          clearLocalAdminSession()
          setLocalAdmin(false)
        }} />
        <EmptyState
          icon={<Users size={40} />}
          title="Cloud admin required"
          description="User management requires a signed-in Supabase admin account. Local admin PIN cannot modify user profiles."
        />
      </Layout>
    )
  }

  return (
    <Layout title="User Management">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Grant premium access to early testers and supporters. All changes are logged.
        </p>

        <AdminHubNav
          showExit={access === 'pin_required'}
          onExit={() => {
            clearLocalAdminSession()
            setLocalAdmin(false)
          }}
        />

        <Input
          label="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Username, email, role..."
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-monster-green">{success}</p> : null}

        {loading ? (
          <LoadingSpinner label="Loading users..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={40} />} title="No users found" description="No profiles match your search." />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((row) => {
              const premiumActive = isPremiumActive(row) && !isPremiumExpired(row)
              const busy = actionLoadingId === row.id

              return (
                <Card key={row.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">
                        {row.username ? `@${row.username}` : row.display_name ?? 'Unnamed user'}
                      </p>
                      <p className="text-xs text-monster-muted">
                        {[row.display_name, row.email].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mt-1 text-xs text-monster-muted">
                        Joined {new Date(row.created_at).toLocaleDateString()} · {row.total_cans}{' '}
                        cans · {row.role}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {premiumActive ? (
                          <PremiumBadge profile={row} size="sm" />
                        ) : (
                          <span className="text-xs text-monster-muted">Free</span>
                        )}
                        {row.premium_source ? (
                          <span className="text-[10px] text-monster-muted">
                            {formatPremiumSource(row.premium_source)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {row.username ? (
                      <Link
                        to={`/u/${row.username}`}
                        className="flex items-center gap-1 text-xs text-monster-green hover:underline"
                      >
                        <ExternalLink size={12} />
                        Profile
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Button
                      variant="secondary"
                      className="py-2 text-xs"
                      loading={busy}
                      onClick={() => {
                        setGrantError(null)
                        setGrantTarget(row)
                      }}
                    >
                      <Crown size={14} />
                      Grant Premium
                    </Button>
                    <Button
                      variant="secondary"
                      className="py-2 text-xs"
                      loading={busy}
                      disabled={!premiumActive || !user}
                      onClick={() =>
                        user &&
                        void runAction(
                          row.id,
                          () => removePremium(user.id, row.id),
                          `Removed premium from ${row.username ?? row.display_name}`,
                        )
                      }
                    >
                      Remove Premium
                    </Button>
                    {row.role !== 'admin' ? (
                      <Button
                        variant="secondary"
                        className="py-2 text-xs"
                        loading={busy}
                        disabled={!user || row.id === user.id}
                        onClick={() =>
                          user &&
                          void runAction(
                            row.id,
                            () => setUserRole(user.id, row.id, 'admin'),
                            `Made ${row.username ?? row.display_name} an admin`,
                          )
                        }
                      >
                        <Shield size={14} />
                        Make Admin
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="py-2 text-xs"
                        loading={busy}
                        disabled={!user || row.id === user.id}
                        onClick={() =>
                          user &&
                          void runAction(
                            row.id,
                            () => setUserRole(user.id, row.id, 'user'),
                            `Removed admin from ${row.username ?? row.display_name}`,
                          )
                        }
                      >
                        <UserCog size={14} />
                        Remove Admin
                      </Button>
                    )}
                    {row.username ? (
                      <Link to={`/u/${row.username}`} className="col-span-2 sm:col-span-1">
                        <Button variant="ghost" fullWidth className="py-2 text-xs">
                          <ExternalLink size={14} />
                          View Profile
                        </Button>
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {MANUAL_GRANT_BADGE_IDS.map((badgeId) => {
                      const badge = getBadgeFromCatalog(badgeId)
                      if (!badge || !user) return null
                      return (
                        <Button
                          key={badgeId}
                          variant="ghost"
                          className="py-1 text-[10px]"
                          loading={busy}
                          onClick={() =>
                            void runAction(
                              row.id,
                              () => grantManualBadge(user.id, row.id, badgeId),
                              `Granted ${badge.name} to ${row.username ?? row.display_name}`,
                            )
                          }
                        >
                          {badge.emoji} Grant {badge.name}
                        </Button>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {actions.length > 0 ? (
          <section>
            <p className="mb-2 text-sm font-semibold text-white">Recent admin actions</p>
            <div className="flex flex-col gap-2">
              {actions.map((action) => (
                <Card key={action.id} className="p-3">
                  <p className="text-xs text-white">{action.details ?? action.action}</p>
                  <p className="mt-1 text-[10px] text-monster-muted">
                    {new Date(action.created_at).toLocaleString()}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <AdminGrantPremiumModal
          open={Boolean(grantTarget)}
          user={grantTarget}
          saving={grantSaving}
          error={grantError}
          onClose={() => setGrantTarget(null)}
          onSave={(input) => void handleGrant(input)}
        />
      </div>
    </Layout>
  )
}
