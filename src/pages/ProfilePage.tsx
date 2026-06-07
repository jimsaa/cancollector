import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Crown, HardDrive, LogOut, UserPlus } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() {
  const {
    user,
    profile,
    displayLabel,
    signOut,
    updateProfile,
    isCloudSynced,
    isGuest,
    isConfigured,
  } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCloudSynced) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateProfile({ display_name: displayName.trim() })
      setMessage('Profile updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  const premiumStatus = profile?.premium_status ?? 'free'
  const isPremium = premiumStatus === 'premium'

  return (
    <Layout title="Profile">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-monster-green/20 text-xl font-bold text-monster-green">
              {(displayLabel ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-white">{displayLabel}</p>
              <p className="truncate text-sm text-monster-muted">
                {isCloudSynced ? user?.email : 'Guest — saved on this device only'}
              </p>
            </div>
          </div>
        </Card>

        {isGuest && isConfigured ? (
          <Card className="border-monster-green/30 bg-monster-green/5">
            <div className="flex items-start gap-3">
              <UserPlus size={20} className="mt-0.5 shrink-0 text-monster-green" />
              <div>
                <p className="text-sm font-semibold text-white">Sync your collection online</p>
                <p className="mt-1 text-xs text-monster-muted">
                  Create a free account to protect your cans if you change devices. Your local
                  collection can be imported after signing up.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link to="/register">
                    <Button className="py-2 text-xs">Create Free Account</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" className="py-2 text-xs">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {isCloudSynced ? (
          <Card>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
              {message ? <p className="text-sm text-monster-green">{message}</p> : null}
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </form>
          </Card>
        ) : null}

        <Link
          to="/stats"
          className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-card p-4 transition-colors hover:border-monster-green/50"
        >
          <BarChart3 size={22} className="text-monster-green" />
          <div>
            <p className="text-sm font-semibold text-white">Collector Statistics</p>
            <p className="text-xs text-monster-muted">Charts, duplicates, countries & growth</p>
          </div>
        </Link>

        <Link
          to="/backup"
          className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-card p-4 transition-colors hover:border-monster-green/50"
        >
          <HardDrive size={22} className="text-monster-green" />
          <div>
            <p className="text-sm font-semibold text-white">Backup & Restore</p>
            <p className="text-xs text-monster-muted">Export or import your collection</p>
          </div>
        </Link>

        {isCloudSynced ? (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Plan</p>
                <p className="text-sm capitalize text-monster-muted">{premiumStatus}</p>
                {profile?.premium_until ? (
                  <p className="text-xs text-monster-muted">
                    Until {new Date(profile.premium_until).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
              {isPremium ? (
                <Crown className="text-yellow-400" size={24} />
              ) : (
                <Link
                  to="/premium"
                  className="rounded-lg bg-monster-green/20 px-3 py-1.5 text-xs font-semibold text-monster-green hover:bg-monster-green/30"
                >
                  Upgrade
                </Link>
              )}
            </div>
          </Card>
        ) : null}

        {isCloudSynced ? (
          <Button variant="secondary" fullWidth onClick={() => signOut()}>
            <LogOut size={18} className="mr-2 inline" />
            Sign out
          </Button>
        ) : null}
      </div>
    </Layout>
  )
}
