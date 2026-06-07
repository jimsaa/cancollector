import { CheckCircle2, Edit3, RotateCcw, AlertTriangle, Package } from 'lucide-react'
import type { CanFormData } from '../cans/CanForm'
import { getDisplayImageUrl } from '../../lib/canImage'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export type LookupStatus = 'found' | 'not_found' | 'error'

interface ScanConfirmScreenProps {
  data: CanFormData
  lookupStatus: LookupStatus
  saving: boolean
  saveError: string | null
  onEdit: () => void
  onSave: () => void
  onScanAgain: () => void
}

function MetaItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 border-b border-monster-border py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-monster-muted">{label}</span>
      <span className="text-right text-sm text-white">{value}</span>
    </div>
  )
}

const statusCopy: Record<LookupStatus, { title: string; tone: 'success' | 'warning' }> = {
  found: { title: 'Product found on Open Food Facts', tone: 'success' },
  not_found: { title: 'Barcode not in Open Food Facts', tone: 'warning' },
  error: { title: 'Could not reach Open Food Facts', tone: 'warning' },
}

export function ScanConfirmScreen({
  data,
  lookupStatus,
  saving,
  saveError,
  onEdit,
  onSave,
  onScanAgain,
}: ScanConfirmScreenProps) {
  const status = statusCopy[lookupStatus]
  const previewImage = getDisplayImageUrl(data)

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          status.tone === 'success'
            ? 'border-monster-green/40 bg-monster-green/10'
            : 'border-yellow-600/40 bg-yellow-900/20'
        }`}
      >
        {status.tone === 'success' ? (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-monster-green" />
        ) : (
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-yellow-400" />
        )}
        <div>
          <p className="text-sm font-semibold text-white">{status.title}</p>
          <p className="mt-1 text-xs text-monster-muted">
            Review the details below before saving to your collection.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex gap-4 p-4">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-monster-dark">
            {previewImage ? (
              <img
                src={previewImage}
                alt={data.name || 'Product'}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package size={32} className="text-monster-green/30" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight text-white">
              {data.name || 'Unknown product'}
            </p>
            {data.flavor ? (
              <p className="mt-0.5 text-sm text-monster-muted">{data.flavor}</p>
            ) : null}
            <p className="mt-2 font-mono text-xs text-monster-green">{data.barcode}</p>
          </div>
        </div>

        <div className="border-t border-monster-border px-4 pb-2">
          <MetaItem label="Brand" value={data.brand} />
          <MetaItem label="Volume" value={data.volume} />
          <MetaItem label="Country" value={data.country} />
          <MetaItem label="Country Variant" value={data.country_variant} />
          <MetaItem label="Quantity" value={String(data.quantity)} />
          <MetaItem label="Rarity" value={data.rarity} />
        </div>
      </Card>

      {saveError ? <p className="text-sm text-red-400">{saveError}</p> : null}

      <Button fullWidth loading={saving} onClick={onSave} className="py-4">
        <CheckCircle2 size={20} />
        Confirm & Save to Collection
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onEdit}>
          <Edit3 size={18} />
          Edit Details
        </Button>
        <Button variant="ghost" onClick={onScanAgain}>
          <RotateCcw size={18} />
          Scan Again
        </Button>
      </div>
    </div>
  )
}
