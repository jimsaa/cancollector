import { ArrowLeft, CheckCircle2, Package } from 'lucide-react'
import type { CanFormData } from '../cans/CanForm'
import { getDisplayImageUrl, IMAGE_SOURCE_LABELS } from '../../lib/canImage'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface AddCanStepSummaryProps {
  data: CanFormData
  saving: boolean
  saveError: string | null
  onBack: () => void
  onSave: () => void
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-monster-border py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-monster-muted">{label}</span>
      <span className="text-right text-sm text-white">{value}</span>
    </div>
  )
}

export function AddCanStepSummary({
  data,
  saving,
  saveError,
  onBack,
  onSave,
}: AddCanStepSummaryProps) {
  const previewImage = getDisplayImageUrl(data)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-monster-muted">
        Everything looks good? Save this can to your collection. Nothing is stored until you tap
        Save.
      </p>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col items-center gap-3 border-b border-monster-border bg-monster-dark p-4">
          <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-monster-border bg-monster-card">
            {previewImage ? (
              <img
                src={previewImage}
                alt={data.name || 'Can'}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package size={40} className="text-monster-green/30" />
              </div>
            )}
          </div>
          <p className="text-xs text-monster-muted">
            Image: {IMAGE_SOURCE_LABELS[data.image_source]}
          </p>
        </div>

        <div className="px-4 pb-2 pt-1">
          <SummaryRow label="Name" value={data.name || '—'} />
          <SummaryRow label="Brand" value={data.brand || '—'} />
          <SummaryRow label="Flavor" value={data.flavor || '—'} />
          <SummaryRow label="Volume" value={data.volume || '—'} />
          <SummaryRow label="Country" value={data.country || '—'} />
          <SummaryRow label="Barcode" value={data.barcode || '—'} />
          <SummaryRow label="Quantity" value={`×${data.quantity}`} />
          <SummaryRow label="Condition" value={data.opened ? 'Opened' : 'Unopened'} />
          <SummaryRow
            label="Trade"
            value={data.available_for_trade ? 'Available for trade' : 'Not for trade'}
          />
        </div>
      </Card>

      {saveError ? <p className="text-sm text-red-400">{saveError}</p> : null}

      <Button fullWidth loading={saving} onClick={onSave} className="py-4">
        <CheckCircle2 size={20} />
        Save Can
      </Button>

      <Button variant="secondary" fullWidth onClick={onBack} disabled={saving}>
        <ArrowLeft size={18} />
        Back to Review
      </Button>
    </div>
  )
}
