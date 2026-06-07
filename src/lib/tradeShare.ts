import type { Can } from '../types/can'

export interface TradeSharePayload {
  v: 1
  t: string
  items: Array<{
    n: string | null
    f: string | null
    v: string | null
    c: string | null
    cv: string | null
    q: number
  }>
}

export function buildTradeSharePayload(cans: Can[]): TradeSharePayload {
  return {
    v: 1,
    t: new Date().toISOString(),
    items: cans.map((c) => ({
      n: c.name,
      f: c.flavor,
      v: c.volume,
      c: c.country,
      cv: c.country_variant,
      q: c.quantity,
    })),
  }
}

export function encodeTradeShareUrl(cans: Can[]): string {
  const payload = buildTradeSharePayload(cans)
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  return `${window.location.origin}/trade/share?d=${encodeURIComponent(encoded)}`
}

export function decodeTradeShareParam(param: string): TradeSharePayload | null {
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(param))))
    const payload = JSON.parse(json) as TradeSharePayload
    if (payload.v !== 1 || !Array.isArray(payload.items)) return null
    return payload
  } catch {
    return null
  }
}

export function formatTradeShareText(cans: Can[]): string {
  const lines = cans.map((c) => {
    const parts = [c.name, c.flavor, c.volume, c.country, c.country_variant].filter(Boolean)
    const qty = c.quantity > 1 ? ` (×${c.quantity})` : ''
    return `• ${parts.join(' — ')}${qty}`
  })
  return `CanCollector Trade List\n\n${lines.join('\n')}\n\n${cans.length} cans available for trade.`
}
