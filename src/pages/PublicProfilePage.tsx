import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftRight, BadgeCheck, Globe, Layers, Lock, Package } from 'lucide-react'
import { Logo } from '../components/brand/Logo'
import { APP_NAME } from '../constants/branding'
import { CollectionProgressCard } from '../components/profile/CollectionProgressCard'
import { CollectorRankBadge } from '../components/profile/CollectorRankBadge'
import { FeaturedCanCard } from '../components/profile/FeaturedCanCard'
import { ProfileFutureFeatures } from '../components/profile/ProfileFutureFeatures'
import { PublicCanCard } from '../components/profile/PublicCanCard'
import { PublicCollectorStats } from '../components/profile/PublicCollectorStats'
import { SocialShareButtons } from '../components/profile/SocialShareButtons'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { applyOpenGraphMeta } from '../lib/openGraph'
import { isPremiumActive, getPremiumFeatures } from '../lib/premium'
import {
  computePublicProfileStats,
  fetchProfileByUsername,
  fetchPublicCans,
  fetchPublicTradeListings,
  getPublicDisplayName,
  resolveFeaturedCan,
} from '../lib/publicProfiles'
import { getPublicProfileShareUrl } from '../lib/socialShare'
import type { PublicProfile, PublicProfileStats } from '../types/profile'
import type { Can } from '../types/can'
import type { TradeListing } from '../types/trade'
import { isConfigured } from '../lib/mode'
import { formatSupabaseError } from '../lib/supabaseDebug'

const APP_ICON = '/pwa-512x512.png'

const EMPTY_STATS: PublicProfileStats = {
  totalCans: 0,
  unopenedCount: 0,
  tradeCount: 0,
  wishlistCount: 0,
  activeTradeListings: 0,
  countriesRepresented: 0,
  brandsCollected: 0,
  duplicates: 0,
  rareCans: 0,
  completionPercentage: 0,
  completionOwned: 0,
  completionTotal: 0,
}

export function PublicProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [stats, setStats] = useState<PublicProfileStats | null>(null)
  const [recentCans, setRecentCans] = useState<Can[]>([])
  const [featuredCan, setFeaturedCan] = useState<Can | null>(null)
  const [listings, setListings] = useState<TradeListing[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const displayName = profile ? getPublicDisplayName(profile) : username
  const isPremium = profile ? isPremiumActive(profile) : false
  const premiumFeatures = profile
    ? getPremiumFeatures(profile, { isCloudMode: isConfigured })
    : getPremiumFeatures(null, { isCloudMode: isConfigured })
  const recentLimit = premiumFeatures.maxPublicRecentCans

  useEffect(() => {
    if (!username) return
    let active = true
    setLoading(true)
    setNotFound(false)
    setIsPrivate(false)
    setLoadError(null)

    ;(async () => {
      try {
        const fetched = await fetchProfileByUsername(username)
        if (!active) return

        if (!fetched) {
          setNotFound(true)
          setProfile(null)
          setLoadError(
            isConfigured
              ? 'No collector profile exists for this username. Save your username in Profile Settings with Public profile enabled.'
              : 'Cloud profiles are unavailable on this deployment.',
          )
          return
        }

        if (!fetched.is_public_profile) {
          setIsPrivate(true)
          setProfile(fetched)
          return
        }

        setProfile(fetched)

        let cans: Can[] = []
        let tradeListings: TradeListing[] = []
        let computed: PublicProfileStats | null = null
        let sectionError: string | null = null

        try {
          cans = await fetchPublicCans(fetched.id)
          tradeListings = await fetchPublicTradeListings(fetched.id)
          computed = await computePublicProfileStats(fetched.id, cans, tradeListings.length)
        } catch (err) {
          sectionError = formatSupabaseError(err, 'Could not load collection details')
        }

        if (!active) return

        setStats(computed ?? EMPTY_STATS)
        setRecentCans(cans.filter((c) => !c.is_wishlist).slice(0, recentLimit))
        setFeaturedCan(resolveFeaturedCan(cans, fetched.featured_can_id))
        setListings(tradeListings)
        if (sectionError) setLoadError(sectionError)
      } catch (err) {
        if (active) {
          setNotFound(true)
          setLoadError(formatSupabaseError(err, 'Could not load collector profile'))
        }
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [username, recentLimit])

  const ogMeta = useMemo(() => {
    if (!profile || !stats || !profile.is_public_profile) return null
    return {
      title: `${displayName}'s Can Collection`,
      description: `${stats.totalCans} cans collected · ${stats.activeTradeListings} active trade listings`,
      image: profile.avatar_url ?? getAbsoluteUrlStatic(APP_ICON),
      url: getPublicProfileShareUrl(profile.username),
    }
  }, [profile, stats, displayName])

  useEffect(() => {
    if (!ogMeta) return
    return applyOpenGraphMeta(ogMeta)
  }, [ogMeta])

  if (loading) {
    return (
      <div className="min-h-dvh bg-monster-black">
        <LoadingSpinner fullPage label="Loading collector profile..." />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-dvh bg-monster-black px-4 py-8">
        <EmptyState
          icon={<Globe size={40} />}
          title="Collector not found"
          description={
            loadError ??
            'This username does not exist or cloud profiles are unavailable.'
          }
          action={
            <Link to="/" className="text-sm text-monster-green hover:underline">
              Go to {APP_NAME}
            </Link>
          }
        />
      </div>
    )
  }

  if (isPrivate) {
    return (
      <div className="min-h-dvh bg-monster-black">
        <header className="border-b border-monster-border px-4 py-4">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <Logo size="sm" />
            <p className="text-sm font-semibold text-white">{APP_NAME}</p>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 py-12">
          <EmptyState
            icon={<Lock size={40} />}
            title="This collector profile is private."
            description="The owner has not enabled public sharing for this profile."
            action={
              <Link to="/" className="text-sm text-monster-green hover:underline">
                Explore {APP_NAME}
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  const activeStats = stats ?? EMPTY_STATS

  return (
    <div className="min-h-dvh bg-monster-black">
      <header className="border-b border-monster-border px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Logo size="sm" />
          <div>
            <p className="text-xs uppercase tracking-wide text-monster-green">Public Collector</p>
            <p className="text-sm font-semibold text-white">{displayName}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="flex flex-col gap-4">
          {loadError ? (
            <p className="rounded-xl border border-yellow-600/30 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-200">
              {loadError}
            </p>
          ) : null}

          <Card>
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-monster-green/20">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-monster-green">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-bold text-white">{displayName}</h1>
                  {isPremium ? (
                    <BadgeCheck size={18} className="shrink-0 text-monster-green" aria-label="Verified collector" />
                  ) : null}
                </div>
                <p className="text-sm text-monster-muted">@{profile.username}</p>
                {profile.country ? (
                  <p className="mt-1 text-xs text-monster-muted">{profile.country}</p>
                ) : null}
                {profile.bio ? <p className="mt-2 text-sm text-white/90">{profile.bio}</p> : null}
              </div>
            </div>
          </Card>

          <CollectorRankBadge completionPercent={activeStats.completionPercentage} />
          <CollectionProgressCard stats={activeStats} />

          {featuredCan ? <FeaturedCanCard can={featuredCan} /> : null}

          <PublicCollectorStats stats={activeStats} />

          <Card className="p-4">
            <SocialShareButtons
              username={profile.username}
              collectedCount={activeStats.totalCans}
            />
          </Card>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Layers size={18} className="text-monster-green" />
              <h2 className="text-sm font-semibold text-white">
                Recent cans {recentLimit < 24 ? `(showing ${recentLimit})` : ''}
              </h2>
            </div>
            {recentCans.length === 0 ? (
              <p className="text-sm text-monster-muted">No collection cans to show yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recentCans.map((can) => (
                  <PublicCanCard key={can.id} can={can} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-monster-green" />
                <h2 className="text-sm font-semibold text-white">Trade Listings</h2>
              </div>
              <span className="rounded-full bg-monster-green/20 px-2.5 py-0.5 text-xs font-semibold text-monster-green">
                {activeStats.activeTradeListings} Active
              </span>
            </div>
            {listings.length === 0 ? (
              <p className="text-sm text-monster-muted">No active trade listings.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {listings.map((listing) => (
                  <Link key={listing.id} to={`/trade/listing/${listing.id}`}>
                    <Card className="p-3 transition-colors hover:border-monster-green/40">
                      <p className="font-semibold text-white">{listing.title}</p>
                      <p className="text-xs text-monster-muted">
                        {[listing.flavor, listing.volume, listing.region].filter(Boolean).join(' · ')}
                      </p>
                      {listing.asking_for ? (
                        <p className="mt-1 text-xs text-monster-green">Wants: {listing.asking_for}</p>
                      ) : null}
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <ProfileFutureFeatures premiumFeatures={premiumFeatures} isPremium={isPremium} />

          <p className="pb-8 text-center text-xs text-monster-muted">
            <Package size={12} className="mr-1 inline" />
            Powered by{' '}
            <Link to="/" className="text-monster-green hover:underline">
              {APP_NAME}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function getAbsoluteUrlStatic(path: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }
  return path
}
