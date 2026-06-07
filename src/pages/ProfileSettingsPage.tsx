import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Crown, Globe, Upload } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { SocialShareButtons } from '../components/profile/SocialShareButtons'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { uploadAvatar } from '../lib/avatarStorage'
import { isUsernameAvailable } from '../lib/publicProfiles'
import { normalizeUsernameInput, publicProfilePath, validateUsername } from '../lib/username'
import { isPremiumActive } from '../lib/premium'

export function ProfileSettingsPage() {
  const { user, profile, isCloudSynced, isGuest, updateProfile, refreshProfile, premiumFeatures } =
    useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [publicDisplayName, setPublicDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username ?? '')
    setPublicDisplayName(profile.public_display_name ?? profile.display_name ?? '')
    setBio(profile.bio ?? '')
    setCountry(profile.country ?? '')
    setIsPublic(profile.is_public_profile)
    setAvatarUrl(profile.avatar_url)
  }, [profile])

  if (isGuest) {
    return <Navigate to="/profile" replace />
  }

  if (!isCloudSynced || !user) {
    return <Navigate to="/profile" replace />
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadAvatar(user.id, file)
      setAvatarUrl(url)
      await updateProfile({ avatar_url: url })
      await refreshProfile()
      setMessage('Avatar updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const normalizedUsername = normalizeUsernameInput(username)
    const usernameError = isPublic ? validateUsername(normalizedUsername) : null
    if (usernameError) {
      setError(usernameError)
      setSaving(false)
      return
    }

    try {
      if (normalizedUsername) {
        const available = await isUsernameAvailable(normalizedUsername, user.id)
        if (!available) {
          setError('That username is already taken')
          setSaving(false)
          return
        }
      }

      await updateProfile({
        username: normalizedUsername || null,
        public_display_name: publicDisplayName.trim() || null,
        bio: bio.trim() || null,
        country: country.trim() || null,
        is_public_profile: isPublic,
      })
      await refreshProfile()
      setMessage('Profile settings saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const canShare = isPublic && Boolean(profile?.username)
  const displayName = publicDisplayName.trim() || username || 'Collector'

  return (
    <Layout title="Profile Settings">
      <div className="flex flex-col gap-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm text-monster-muted hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to profile
        </Link>

        <Card>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-monster-green/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-monster-green">
                    {(publicDisplayName || displayName).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs"
                  loading={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={14} className="mr-1 inline" />
                  Upload avatar
                </Button>
              </div>
            </div>

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(normalizeUsernameInput(e.target.value))}
              placeholder="your-collector-name"
              autoComplete="off"
              required={isPublic}
            />
            <p className="-mt-2 text-xs text-monster-muted">
              Public link: {username ? publicProfilePath(username) : '/u/username'} · 3–24 chars,
              lowercase
            </p>

            <Input
              label="Public display name"
              value={publicDisplayName}
              onChange={(e) => setPublicDisplayName(e.target.value)}
              placeholder="How collectors see you"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bio" className="text-xs font-medium uppercase tracking-wide text-monster-muted">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={280}
                placeholder="Tell other collectors about your collection..."
                className="rounded-xl border border-monster-border bg-monster-dark px-4 py-3 text-sm text-white placeholder:text-monster-muted focus:border-monster-green focus:outline-none focus:ring-1 focus:ring-monster-green"
              />
            </div>

            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Sweden"
            />

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-monster-border bg-monster-dark px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">Public profile</p>
                <p className="text-xs text-monster-muted">Allow anyone with your link to view stats</p>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 accent-monster-green"
              />
            </label>

            {message ? <p className="text-sm text-monster-green">{message}</p> : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <Button type="submit" fullWidth loading={saving}>
              Save settings
            </Button>
          </form>
        </Card>

        {canShare && profile?.username ? (
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Globe size={18} className="text-monster-green" />
              <p className="text-sm font-semibold text-white">Share your collector profile</p>
            </div>
            <SocialShareButtons
              username={profile.username}
              shareTitle={`${displayName}'s Can Collection`}
              shareDescription={`Check out ${displayName}'s energy drink can collection on CanCollector`}
            />
          </Card>
        ) : null}

        <Card className="border-yellow-600/20 bg-yellow-900/10">
          <div className="flex items-start gap-2">
            <Crown size={18} className="mt-0.5 text-yellow-400" />
            <div>
              <p className="text-sm font-semibold text-white">Premium profile features (coming)</p>
              <ul className="mt-2 space-y-1 text-xs text-monster-muted">
                <li className={premiumFeatures.canUseCustomProfileTheme ? 'text-monster-green' : ''}>
                  Custom profile theme {premiumFeatures.canUseCustomProfileTheme ? '✓' : '— premium'}
                </li>
                <li className={premiumFeatures.canUseFeaturedCans ? 'text-monster-green' : ''}>
                  Featured cans gallery ({premiumFeatures.maxPublicRecentCans} shown for{' '}
                  {isPremiumActive(profile) ? 'premium' : 'free'})
                </li>
                <li className={premiumFeatures.canUseVerifiedCollectorBadge ? 'text-monster-green' : ''}>
                  Verified collector badge
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
