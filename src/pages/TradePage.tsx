import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Share2,
  ArrowLeftRight,
  Link2,
  Heart,
  Users,
  Sparkles,
  Package,
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { TradeListingCard } from '../components/trade/TradeListingCard'
import { APP_NAME } from '../constants/branding'
import { useAuth } from '../hooks/useAuth'
import { useGuestMessaging } from '../hooks/useGuestMessaging'
import { useCans } from '../hooks/useCans'
import { useTrade } from '../hooks/useTrade'
import { encodeTradeShareUrl, formatTradeShareText } from '../lib/tradeShare'
import { filterActiveTradeListings } from '../types/trade'

type TradeTab = 'offering' | 'seeking' | 'matches'

const tabs: { id: TradeTab; label: string; icon: typeof Package }[] = [
  { id: 'offering', label: 'Offering', icon: ArrowLeftRight },
  { id: 'seeking', label: 'Seeking', icon: Heart },
  { id: 'matches', label: 'Matches', icon: Sparkles },
]

export function TradePage() {
  const { storageUserId, isGuest, isPremium, premiumFeatures } = useAuth()
  const { triggerRegisterCTA } = useGuestMessaging()
  const { cans, loading: cansLoading, update } = useCans(storageUserId, premiumFeatures.maxActiveTradeListings)
  const { listings, wants, matches, loading: tradeLoading, profile, setMatchingEnabled, matchingAvailable } =
    useTrade(storageUserId, cans)
  const [tab, setTab] = useState<TradeTab>('offering')
  const [copied, setCopied] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const activeListings = useMemo(() => filterActiveTradeListings(listings), [listings])

  const tradeCans = useMemo(
    () => cans.filter((c) => !c.is_wishlist && c.available_for_trade),
    [cans],
  )

  const canById = useMemo(() => new Map(cans.map((c) => [c.id, c])), [cans])

  const collectionForTrade = useMemo(
    () => cans.filter((c) => !c.is_wishlist).slice(0, 12),
    [cans],
  )

  const shareText = () => formatTradeShareText(tradeCans)

  const shareNative = () => {
    const text = shareText()
    if (navigator.share) {
      navigator.share({ title: `${APP_NAME} Trade List`, text }).catch(() => {
        navigator.clipboard.writeText(text)
      })
    } else {
      navigator.clipboard.writeText(text)
      alert('Trade list copied to clipboard!')
    }
  }

  const copyShareLink = async () => {
    const url = encodeTradeShareUrl(tradeCans)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleForTrade = async (canId: string, current: boolean) => {
    setTogglingId(canId)
    try {
      await update(canId, { available_for_trade: !current })
      if (!current) triggerRegisterCTA('trade_listing')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update trade status')
    } finally {
      setTogglingId(null)
    }
  }

  const loading = cansLoading || tradeLoading

  return (
    <Layout title="Trade">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Mark cans for trade, list what you want, and preview collector matches. Messaging coming
          later.
        </p>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl border border-monster-border bg-monster-card p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors ${
                tab === id
                  ? 'bg-monster-green/20 text-monster-green'
                  : 'text-monster-muted hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
              {id === 'matches' && matches.length > 0 ? (
                <span className="rounded-full bg-monster-green px-1.5 text-[9px] font-bold text-black">
                  {matches.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading trade data..." />
        ) : (
          <>
            {tab === 'offering' ? (
              <div className="flex flex-col gap-4">
                {tradeCans.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" fullWidth onClick={shareNative}>
                      <Share2 size={18} />
                      Share as Text
                    </Button>
                    <Button variant="secondary" fullWidth onClick={copyShareLink}>
                      <Link2 size={18} />
                      {copied ? 'Link Copied!' : 'Copy Shareable Link'}
                    </Button>
                  </div>
                ) : null}

                <Card className="p-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-monster-muted">
                    Quick mark for trade
                  </p>
                  {collectionForTrade.length === 0 ? (
                    <p className="text-sm text-monster-muted">No collection cans yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {collectionForTrade.map((can) => (
                        <div
                          key={can.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-monster-border px-3 py-2"
                        >
                          <Link
                            to={`/can/${can.id}`}
                            className="min-w-0 flex-1 truncate text-sm text-white hover:text-monster-green"
                          >
                            {can.name ?? 'Unknown'}
                          </Link>
                          <input
                            type="checkbox"
                            checked={can.available_for_trade}
                            disabled={togglingId === can.id}
                            onChange={() => toggleForTrade(can.id, can.available_for_trade)}
                            className="h-5 w-5 shrink-0 accent-monster-green"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <Link to="/collection" className="mt-2 block text-xs text-monster-green hover:underline">
                    View full collection
                  </Link>
                </Card>

                {activeListings.length === 0 ? (
                  <EmptyState
                    icon={<ArrowLeftRight size={40} />}
                    title="No active listings"
                    description="Mark cans for trade and set listing status to available on the can detail page."
                    action={
                      <Link to="/collection">
                        <Button variant="secondary">Browse collection</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-monster-muted">
                      {activeListings.length} active listing{activeListings.length === 1 ? '' : 's'}
                    </p>
                    {activeListings.map((listing) => (
                      <TradeListingCard
                        key={listing.id}
                        listing={listing}
                        can={canById.get(listing.can_id)}
                        showPriority={isPremium && premiumFeatures.canUsePriorityTradeBadge}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {tab === 'seeking' ? (
              <div className="flex flex-col gap-4">
                <Link
                  to="/missing"
                  className="flex items-center gap-2 rounded-xl border border-monster-border bg-monster-card px-3 py-3 text-sm text-monster-green"
                >
                  <Heart size={16} />
                  Browse global database & mark wanted
                </Link>

                {wants.length === 0 ? (
                  <EmptyState
                    icon={<Heart size={40} />}
                    title="No wanted cans"
                    description="Mark missing cans as wanted or add items to your wishlist."
                    action={
                      <Link to="/wishlist">
                        <Button variant="secondary">Open Wishlist</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-monster-muted">{wants.length} wanted for trade</p>
                    {wants.map((want) => (
                      <Link key={want.id} to={want.can_id ? `/can/${want.can_id}` : '/wishlist'}>
                        <Card className="p-3">
                          <p className="font-semibold text-white">{want.product_name ?? 'Unknown'}</p>
                          <p className="text-xs text-monster-muted">
                            {[want.brand, want.flavor, want.barcode].filter(Boolean).join(' · ')}
                          </p>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {tab === 'matches' ? (
              <div className="flex flex-col gap-4">
                {isGuest ? (
                  <Card className="border-yellow-600/40 bg-yellow-900/20 p-4">
                    <p className="text-sm font-semibold text-yellow-300">Cloud Mode required</p>
                    <p className="mt-1 text-xs text-monster-muted">
                      Trade matching across collectors needs Supabase. Your wants and offers are still
                      saved locally.
                    </p>
                  </Card>
                ) : (
                  <Card className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-monster-green" />
                        <div>
                          <p className="text-sm font-semibold text-white">Collector matching</p>
                          <p className="text-xs text-monster-muted">Preview only — no messaging yet</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-monster-muted">
                        Enabled
                        <input
                          type="checkbox"
                          checked={profile?.matching_enabled ?? true}
                          onChange={(e) => setMatchingEnabled(e.target.checked)}
                          className="h-5 w-5 accent-monster-green"
                        />
                      </label>
                    </div>
                  </Card>
                )}

                {!matchingAvailable ? null : matches.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles size={40} />}
                    title="No matches yet"
                    description="Add wanted cans and wait for other collectors to list matching offers."
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-monster-muted">
                      {matches.length} potential match{matches.length === 1 ? '' : 'es'} found
                    </p>
                    {matches.map((match, i) => (
                      <Card key={`${match.want.id}-${match.listing.id}-${i}`} className="p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="rounded-full bg-monster-green/20 px-2 py-0.5 text-[10px] font-semibold text-monster-green">
                            {match.matchType.replace('_', ' ')} · {match.matchScore}%
                          </span>
                          <span className="text-[10px] text-monster-muted">Collector match</span>
                        </div>
                        <p className="text-sm text-white">
                          You want: <span className="font-semibold">{match.want.product_name}</span>
                        </p>
                        <p className="mt-1 text-sm text-monster-muted">
                          Available: <span className="text-white">{match.listing.product_name}</span>
                        </p>
                        <p className="mt-2 text-[10px] text-monster-muted">
                          Messaging & trade requests — coming soon
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Layout>
  )
}
