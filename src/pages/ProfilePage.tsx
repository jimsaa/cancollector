import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, LogOut } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() {
  const { user, profile, displayLabel, signOut, updateProfile, isCloudMode } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCloudMode) return
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
              <p className="truncate text-sm text-monster-muted">{user?.email ?? 'Local mode'}</p>
            </div>
          </div>
        </Card>

        {isCloudMode ? (
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

        {isCloudMode ? (
          <Button variant="secondary" fullWidth onClick={() => signOut()}>
            <LogOut size={18} className="mr-2 inline" />
            Sign out
          </Button>
        ) : null}
      </div>
    </Layout>
  )
}
