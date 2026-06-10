import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CloudUpload,
  Crown,
  Globe,
  HardDrive,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Share2,
  UserPlus,
} from 'lucide-react'
import { isProfileAdmin } from '../lib/adminAuth'
import { Layout } from '../components/layout/Layout'
import { SocialShareButtons } from '../components/profile/SocialShareButtons'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { checkLocalImportState, resetImportPrompt } from '../lib/localImport'
import { getPublicDisplayName } from '../lib/publicProfiles'
import { PremiumBadge } from '../components/profile/PremiumBadge'
import { getDashboardPremiumLabel } from '../lib/premiumBadges'
import { isPremiumActive } from '../lib/premium'
import { fetchCans } from '../lib/cans'

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
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')

  const localImportState = useMemo(
    () => (user && isCloudSynced ? checkLocalImportState(user.id) : null),
    [user?.id, isCloudSynced],
  )

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  useEffect(() => {
    if (!user || !isCloudSynced || !profile?.is_public_profile) return
    void fetchCans(user.id)
      .then((cans) =>
        setCollectedCount(
          cans.filter((c) => !c.is_wishlist).reduce((sum, c) => sum + c.quantity, 0),
        ),
      )
      .catch(() => setCollectedCount(0))
  }, [user?.id, isCloudSynced, profile?.is_public_profile])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collectedCount, setCollectedCount] = useState(0)

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

  const isPremium = isPremiumActive(profile)
  const premiumLabel = getDashboardPremiumLabel(profile)
  const canSharePublic =
    isCloudSynced && profile?.is_public_profile && Boolean(profile.username)

  const publicName =
    profile?.username && profile.is_public_profile
      ? getPublicDisplayName({
          id: profile.id,
          username: profile.username,
          public_display_name: profile.public_display_name,
          bio: profile.bio,
          country: profile.country,
          avatar_url: profile.avatar_url,
          is_public_profile: true,
          premium_status: profile.premium_status,
          premium_until: profile.premium_until,
          is_premium: profile.is_premium,
          premium_source: profile.premium_source,
          premium_expires_at: profile.premium_expires_at,
          featured_can_id: profile.featured_can_id,
          featured_badge_id: profile.featured_badge_id,
          created_at: profile.created_at,
        })
      : null

  return (
    <Layout title="Profile">
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-monster-green/20">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-monster-green">
                  {(displayLabel ?? '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-white">{displayLabel}</p>
              {isPremium ? (
                <div className="mt-1">
                  <PremiumBadge profile={profile} size="sm" />
                </div>
              ) : null}
              <p className="truncate text-sm text-monster-muted">
                {isCloudSynced ? user?.email : 'Guest — saved on this device only'}
              </p>
            </div>
            {isCloudSynced ? (
              <Link to="/profile/settings">
                <Button variant="secondary" className="px-3 py-2 text-xs">
                  <Settings size={14} className="mr-1 inline" />
                  Settings
                </Button>
              </Link>
            ) : null}
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

        {isGuest ? (
          <Card className="border-monster-border">
            <div className="flex items-start gap-3">
              <Share2 size={20} className="mt-0.5 shrink-0 text-monster-muted" />
              <div>
                <p className="text-sm font-semibold text-white">Share your collector profile</p>
                <p className="mt-1 text-xs text-monster-muted">
                  Create a free account to share your public collector profile.
                </p>
                <Link to="/register" className="mt-3 inline-block">
                  <Button className="py-2 text-xs">Create Free Account</Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : null}

        {isCloudSynced && !canSharePublic ? (
          <Card className="border-monster-green/20">
            <div className="flex items-start gap-3">
              <Globe size={20} className="mt-0.5 shrink-0 text-monster-green" />
              <div>
                <p className="text-sm font-semibold text-white">Public collector profile</p>
                <p className="mt-1 text-xs text-monster-muted">
                  Set a username and enable public sharing in profile settings.
                </p>
                <Link to="/profile/settings" className="mt-3 inline-block">
                  <Button className="py-2 text-xs">Profile settings</Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : null}

        {canSharePublic && profile?.username && publicName ? (
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Share2 size={18} className="text-monster-green" />
              <p className="text-sm font-semibold text-white">Your public profile</p>
            </div>
            <SocialShareButtons
              username={profile.username}
              collectedCount={collectedCount}
              shareTitle={`${publicName}'s Can Collection`}
            />
          </Card>
        ) : null}

        {isCloudSynced ? (
          <Card>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Private display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
              <p className="-mt-2 text-xs text-monster-muted">
                Shown in the app header. Public name is set in profile settings.
              </p>
              {message ? <p className="text-sm text-monster-green">{message}</p> : null}
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </form>
          </Card>
        ) : null}

        {isCloudSynced && isProfileAdmin(profile) ? (
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-xl border border-monster-green/30 bg-monster-green/5 p-4 transition-colors hover:border-monster-green/50"
          >
            <LayoutDashboard size={22} className="text-monster-green" />
            <div>
              <p className="text-sm font-semibold text-white">Admin Dashboard</p>
              <p className="text-xs text-monster-muted">Private stats and admin tools</p>
            </div>
          </Link>
        ) : null}

        <Link
          to="/feedback"
          className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-card p-4 transition-colors hover:border-monster-green/50"
        >
          <MessageSquare size={22} className="text-monster-green" />
          <div>
            <p className="text-sm font-semibold text-white">Feedback</p>
            <p className="text-xs text-monster-muted">Report bugs, request features, or flag issues</p>
          </div>
        </Link>

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

        {isCloudSynced && localImportState && localImportState.canCount > 0 ? (
          <Card className="border-monster-green/30 bg-monster-green/5">
            <div className="flex items-start gap-3">
              <CloudUpload size={20} className="mt-0.5 shrink-0 text-monster-green" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Import Guest Collection</p>
                <p className="mt-1 text-xs text-monster-muted">
                  {localImportState.canCount} can{localImportState.canCount === 1 ? '' : 's'} saved
                  on this device
                  {localImportState.importStatus === 'skipped'
                    ? ' — you chose Later earlier'
                    : null}
                </p>
                <Button
                  className="mt-3 py-2 text-xs"
                  onClick={() => {
                    if (user) resetImportPrompt(user.id)
                    navigate('/import-local')
                  }}
                >
                  Import Guest Collection
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {isCloudSynced ? (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Premium Status</p>
                <p className="text-sm text-monster-muted">{premiumLabel}</p>
                {profile?.premium_expires_at ? (
                  <p className="text-xs text-monster-muted">
                    Until {new Date(profile.premium_expires_at).toLocaleDateString()}
                  </p>
                ) : isPremium ? (
                  <p className="text-xs text-monster-green">Lifetime access</p>
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
