import { Link } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import type { Can } from '../../types/can'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface DuplicateCanScreenProps {
  existing: Can
  increasing: boolean
  error: string | null
  onIncreaseQuantity: () => void
  onAddAsNewVariant: () => void
  onScanAgain: () => void
}

export function DuplicateCanScreen({
  existing,
  increasing,
  error,
  onIncreaseQuantity,
  onAddAsNewVariant,
  onScanAgain,
}: DuplicateCanScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-monster-green/40 bg-monster-green/10">
        <p className="text-sm font-semibold text-white">Already in your collection</p>
        <p className="mt-1 text-xs text-monster-muted">
          This barcode matches an existing can
          {existing.country ? ` (${existing.country}` : ''}
          {existing.country_variant ? ` — ${existing.country_variant}` : existing.country ? ')' : ''}
          {existing.country && existing.country_variant ? ')' : ''}.
        </p>
      </Card>

      <Card className="flex gap-4 p-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-monster-dark">
          {existing.image_url ? (
            <img src={existing.image_url} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package size={28} className="text-monster-green/30" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">{existing.name ?? 'Unknown'}</p>
          {existing.flavor ? <p className="text-sm text-monster-muted">{existing.flavor}</p> : null}
          <p className="mt-1 font-mono text-xs text-monster-green">{existing.barcode}</p>
          <p className="mt-2 text-xs text-monster-muted">
            Qty: {existing.quantity}
            {existing.country ? ` · ${existing.country}` : ''}
            {existing.country_variant ? ` · ${existing.country_variant}` : ''}
          </p>
        </div>
      </Card>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button fullWidth loading={increasing} onClick={onIncreaseQuantity} className="py-4">
        <Plus size={20} />
        Increase Quantity (now ×{existing.quantity + 1})
      </Button>

      <Link to={`/can/${existing.id}`}>
        <Button variant="secondary" fullWidth>
          View Existing Can
        </Button>
      </Link>

      <Button variant="ghost" fullWidth onClick={onAddAsNewVariant}>
        Add as different country variant
      </Button>

      <Button variant="ghost" fullWidth onClick={onScanAgain}>
        Scan Another
      </Button>
    </div>
  )
}
