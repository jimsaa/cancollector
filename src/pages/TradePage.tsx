import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Share2, ArrowLeftRight, Link2, Copy } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'
import { encodeTradeShareUrl, formatTradeShareText } from '../lib/tradeShare'

export function TradePage() {
  const { user } = useAuth()
  const { cans, loading, error } = useCans(user?.id)
  const [copied, setCopied] = useState(false)

  const tradeCans = useMemo(
    () => cans.filter((c) => !c.is_wishlist && c.available_for_trade),
    [cans],
  )

  const shareText = () => formatTradeShareText(tradeCans)

  const shareNative = () => {
    const text = shareText()
    if (navigator.share) {
      navigator.share({ title: 'Can Collector Trade List', text }).catch(() => {
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

  return (
    <Layout title="Trade List">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Cans marked for trade. Share a link or text list with other collectors.
        </p>

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
            <p className="text-center text-[10px] text-monster-muted">
              Share link opens a public read-only trade list page.
            </p>
          </div>
        ) : null}

        {loading ? (
          <LoadingSpinner label="Loading trade list..." />
        ) : error ? (
          <EmptyState title="Error" description={error} />
        ) : tradeCans.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight size={40} />}
            title="Nothing for trade"
            description="Mark cans as available for trade from the can detail page."
            action={
              <Link to="/collection">
                <Button variant="secondary">Browse Collection</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {tradeCans.map((can) => (
              <Link key={can.id} to={`/can/${can.id}`}>
                <Card className="flex items-center gap-3 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-monster-dark">
                    {can.image_url ? (
                      <img src={can.image_url} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-black text-monster-green/30">M</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{can.name ?? 'Unknown'}</p>
                    <p className="truncate text-xs text-monster-muted">
                      {[can.flavor, can.volume, can.country, can.country_variant].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-0.5 text-[10px] text-monster-muted">
                      ×{can.quantity} · {can.opened ? 'Opened' : 'Sealed'}
                    </p>
                  </div>
                  <Copy size={14} className="shrink-0 text-monster-muted" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
