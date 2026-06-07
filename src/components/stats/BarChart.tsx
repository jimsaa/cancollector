import type { ChartDatum } from '../../lib/collectorStats'
import { Card } from '../ui/Card'

interface BarChartProps {
  title: string
  data: ChartDatum[]
  emptyMessage?: string
  maxBars?: number
}

export function BarChart({
  title,
  data,
  emptyMessage = 'No data yet',
  maxBars = 8,
}: BarChartProps) {
  const items = data.slice(0, maxBars)
  const max = Math.max(...items.map((d) => d.value), 1)

  return (
    <Card className="p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-monster-muted">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-monster-muted">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const width = Math.max(4, (item.value / max) * 100)
            return (
              <li key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-white">{item.label}</span>
                  <span className="shrink-0 font-semibold text-monster-green">{item.value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-monster-border">
                  <div
                    className="h-full rounded-full bg-monster-green transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {data.length > maxBars ? (
        <p className="mt-3 text-[10px] text-monster-muted">
          Showing top {maxBars} of {data.length}
        </p>
      ) : null}
    </Card>
  )
}
