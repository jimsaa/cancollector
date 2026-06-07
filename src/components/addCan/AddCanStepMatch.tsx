import { CheckCircle2, AlertTriangle, Database, Package, ArrowLeft, ArrowRight, Edit3 } from 'lucide-react'
import type { CanFormData } from '../cans/CanForm'
import { getDisplayImageUrl, IMAGE_SOURCE_LABELS } from '../../lib/canImage'
import type { MasterCan } from '../../types/masterCan'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export type OffLookupStatus = 'found' | 'not_found' | 'error'

interface AddCanStepMatchProps {
  data: CanFormData
  offStatus: OffLookupStatus
  matchedMaster: MasterCan | null
  onBack: () => void
  onContinue: () => void
  onEdit: () => void
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

const offStatusCopy: Record<OffLookupStatus, { title: string; tone: 'success' | 'warning' }> = {
  found: { title: 'Found on Open Food Facts', tone: 'success' },
  not_found: { title: 'Not in Open Food Facts', tone: 'warning' },
  error: { title: 'Could not reach Open Food Facts', tone: 'warning' },
}

export function AddCanStepMatch({
  data,
  offStatus,
  matchedMaster,
  onBack,
  onContinue,
  onEdit,
}: AddCanStepMatchProps) {
  const off = offStatusCopy[offStatus]
  const previewImage = getDisplayImageUrl(data)
  const hasProductData = Boolean(
    data.name || data.brand || data.flavor || data.volume || data.country || previewImage,
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-monster-muted">
        We matched your barcode against Open Food Facts and the verified master database.
      </p>

      <div className="flex flex-col gap-2">
        <Card
          className={`flex items-start gap-3 p-3 ${
            off.tone === 'success'
              ? 'border-monster-green/40 bg-monster-green/10'
              : 'border-yellow-600/40 bg-yellow-900/20'
          }`}
        >
          {off.tone === 'success' ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-monster-green" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">Open Food Facts</p>
            <p className="text-xs text-monster-muted">{off.title}</p>
          </div>
        </Card>

        <Card
          className={`flex items-start gap-3 p-3 ${
            matchedMaster
              ? 'border-monster-green/40 bg-monster-green/10'
              : 'border-monster-border bg-monster-card'
          }`}
        >
          <Database
            size={18}
            className={`mt-0.5 shrink-0 ${matchedMaster ? 'text-monster-green' : 'text-monster-muted'}`}
          />
          <div>
            <p className="text-sm font-semibold text-white">Master Database</p>
            <p className="text-xs text-monster-muted">
              {matchedMaster
                ? `Matched: ${matchedMaster.product_name}`
                : 'No verified master can for this barcode'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex gap-4 p-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-monster-dark">
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
            <span className="absolute bottom-1 left-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] text-monster-muted">
              {IMAGE_SOURCE_LABELS[data.image_source]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight text-white">
              {data.name || 'Unknown product'}
            </p>
            {data.flavor ? (
              <p className="mt-0.5 text-sm text-monster-muted">{data.flavor}</p>
            ) : null}
            <p className="mt-2 font-mono text-xs text-monster-green">{data.barcode}</p>
            {!hasProductData ? (
              <p className="mt-2 text-xs text-yellow-400">
                Limited data found — you can fill in details on the next step.
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-monster-border px-4 pb-2">
          <MetaItem label="Brand" value={data.brand} />
          <MetaItem label="Volume" value={data.volume} />
          <MetaItem label="Country" value={data.country} />
          <MetaItem label="Image source" value={IMAGE_SOURCE_LABELS[data.image_source]} />
        </div>
      </Card>

      <Button fullWidth onClick={onContinue} className="py-4">
        <ArrowRight size={20} />
        Continue
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          <Edit3 size={18} />
          Edit Details
        </Button>
      </div>
    </div>
  )
}
