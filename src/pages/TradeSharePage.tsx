import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Logo } from '../components/brand/Logo'
import { decodeTradeShareParam } from '../lib/tradeShare'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'

export function TradeSharePage() {
  const [params] = useSearchParams()
  const payload = useMemo(() => decodeTradeShareParam(params.get('d') ?? ''), [params])

  if (!payload) {
    return (
      <div className="min-h-dvh bg-monster-black px-4 py-8">
        <EmptyState title="Invalid trade list" description="This share link is broken or expired." />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-monster-black">
      <header className="border-b border-monster-border px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Logo size="sm" />
          <div>
            <p className="text-xs uppercase tracking-wide text-monster-green">CanCollector</p>
            <p className="text-sm font-semibold text-white">Shared Trade List</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">
        <p className="mb-4 text-xs text-monster-muted">
          {payload.items.length} cans · shared {new Date(payload.t).toLocaleDateString()}
        </p>
        <div className="flex flex-col gap-2">
          {payload.items.map((item, i) => (
            <Card key={i} className="p-3">
              <p className="font-semibold text-white">{item.n ?? 'Unknown'}</p>
              <p className="text-xs text-monster-muted">
                {[item.f, item.v, item.c, item.cv].filter(Boolean).join(' · ')}
              </p>
              {item.q > 1 ? (
                <p className="mt-1 text-xs text-monster-green">Quantity: ×{item.q}</p>
              ) : null}
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
