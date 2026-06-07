import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Share2, ArrowLeftRight } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useCans } from '../hooks/useCans'

export function TradePage() {
  const { user } = useAuth()
  const { cans, loading, error } = useCans(user?.id)

  const tradeCans = useMemo(() => cans.filter((c) => c.available_for_trade), [cans])

  const shareList = () => {
    const lines = tradeCans.map((c) => {
      const parts = [c.name, c.flavor, c.volume, c.country].filter(Boolean)
      const qty = c.quantity > 1 ? ` (×${c.quantity})` : ''
      return `• ${parts.join(' — ')}${qty}`
    })
    const text = `Can Collector Trade List\n\n${lines.join('\n')}\n\n${tradeCans.length} cans available for trade.`

    if (navigator.share) {
      navigator.share({ title: 'Can Collector Trade List', text }).catch(() => {
        navigator.clipboard.writeText(text)
      })
    } else {
      navigator.clipboard.writeText(text)
      alert('Trade list copied to clipboard!')
    }
  }

  return (
    <Layout title="Trade List">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-monster-muted">
          Cans marked as available for trade. Share this list with other collectors.
        </p>

        {tradeCans.length > 0 ? (
          <Button variant="secondary" fullWidth onClick={shareList}>
            <Share2 size={18} />
            Share Trade List
          </Button>
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
                      <img
                        src={can.image_url}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-black text-monster-green/30">
                        M
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{can.name ?? 'Unknown'}</p>
                    <p className="truncate text-xs text-monster-muted">
                      {[can.flavor, can.volume, can.country].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {can.quantity > 1 ? (
                    <span className="shrink-0 rounded-full bg-monster-green/20 px-2 py-0.5 text-xs font-semibold text-monster-green">
                      ×{can.quantity}
                    </span>
                  ) : null}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
