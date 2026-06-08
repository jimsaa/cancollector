import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Database,
  Edit3,
  Package,
  Search,
} from 'lucide-react'
import type { CanFormData } from '../cans/CanForm'
import {
  getApprovedMasterReferenceUrl,
  getDisplayImageUrl,
  getOffLookupPreviewUrl,
  IMAGE_SOURCE_LABELS,
} from '../../lib/canImage'
import type { MasterMatchKind, OffLookupStatus } from '../../lib/scanProductLookup'
import type { MatchConfidence } from '../../lib/masterCanProductMatch'
import type { MasterCan } from '../../types/masterCan'
import { VerificationBadge } from './VerificationBadge'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { InfoTooltip } from '../ui/InfoTooltip'

export type { OffLookupStatus }

const DATABASE_TOOLTIP =
  'CanTrove is building a verified collector database. External lookups help identify products not yet verified.'

interface AddCanStepMatchProps {
  data: CanFormData
  offStatus: OffLookupStatus
  primarySource: 'master_database' | 'open_food_facts' | 'none'
  masterCatalogTotal: number
  matchedMaster: MasterCan | null
  matchKind: MasterMatchKind
  matchConfidence: MatchConfidence | null
  possibleMaster: MasterCan | null
  possibleMasterScore: number | null
  declinedNameMatch: boolean
  onAcceptNameMatch: () => void
  onDeclineNameMatch: () => void
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

const lookupStatusCopy: Record<
  OffLookupStatus,
  { detail: string; tone: 'success' | 'warning' | 'neutral' }
> = {
  found: {
    detail: 'External barcode service returned product details for identification.',
    tone: 'success',
  },
  not_found: { detail: 'No product record found for this barcode.', tone: 'warning' },
  error: { detail: 'External lookup service is temporarily unavailable.', tone: 'warning' },
  skipped: { detail: '', tone: 'neutral' },
}

export function AddCanStepMatch({
  data,
  offStatus,
  primarySource,
  masterCatalogTotal,
  matchedMaster,
  matchKind,
  matchConfidence,
  possibleMaster,
  possibleMasterScore,
  declinedNameMatch,
  onAcceptNameMatch,
  onDeclineNameMatch,
  onBack,
  onContinue,
  onEdit,
}: AddCanStepMatchProps) {
  const isMasterVerified = Boolean(matchedMaster && matchKind)
  const isLookupOnly = !isMasterVerified && primarySource === 'open_food_facts'
  const lookup = lookupStatusCopy[offStatus]
  const showLookupSection = offStatus !== 'skipped'

  const offPreview = getOffLookupPreviewUrl(data.off_image_url)
  const masterPreview = getApprovedMasterReferenceUrl({ master_image_url: data.master_image_url })
  const collectionPreview = getDisplayImageUrl(data)
  const showOffPreview = Boolean(offPreview) && offStatus === 'found' && !isMasterVerified

  const hasProductData = Boolean(
    data.name || data.brand || data.flavor || data.volume || data.country || collectionPreview,
  )

  const masterMatchDetail = matchedMaster
    ? matchKind === 'product_name'
      ? `Matched by product name: ${matchedMaster.product_name}`
      : `Matched: ${matchedMaster.product_name}`
    : 'No verified master can for this barcode yet'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm text-monster-muted">
          CanTrove uses its own verified <strong className="text-white">Master Database</strong> as
          the primary source. Barcode lookup services only help identify products not yet in the
          catalog.
        </p>
        <InfoTooltip text={DATABASE_TOOLTIP} className="mt-0.5 shrink-0" />
      </div>

      <p className="rounded-xl border border-monster-border bg-monster-card px-3 py-2 text-xs text-monster-muted">
        <span className="font-semibold text-white">Master Database Coverage:</span>{' '}
        {masterCatalogTotal.toLocaleString()} verified {masterCatalogTotal === 1 ? 'can' : 'cans'}
      </p>

      {/* Master Database — always shown first */}
      <Card
        className={`p-4 ${
          isMasterVerified
            ? 'border-monster-green/50 bg-monster-green/10'
            : 'border-monster-border bg-monster-card'
        }`}
      >
        <div className="flex items-start gap-3">
          <Database
            size={20}
            className={`mt-0.5 shrink-0 ${isMasterVerified ? 'text-monster-green' : 'text-monster-muted'}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">Master Database</p>
              {isMasterVerified ? <VerificationBadge kind="master_verified" /> : null}
            </div>
            <p className="mt-1 text-xs text-monster-muted">{masterMatchDetail}</p>
            <p className="mt-2 text-xs text-white/80">
              {isMasterVerified
                ? 'Verified by CanTrove Master Database'
                : 'CanTrove Master Database does not yet contain a verified version of this product.'}
            </p>
          </div>
        </div>
      </Card>

      {matchedMaster && matchKind === 'product_name' ? (
        <span className="inline-flex w-fit items-center rounded-full bg-monster-green/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-monster-green">
          Matched by product name
        </span>
      ) : null}

      {!matchedMaster && possibleMaster && !declinedNameMatch && matchConfidence === 'medium' ? (
        <Card className="flex flex-col gap-3 border-yellow-600/40 bg-yellow-900/20 p-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
            <div>
              <p className="text-sm font-semibold text-yellow-200">Possible Master Database match</p>
              <p className="text-xs text-yellow-100/80">
                {possibleMaster.product_name}
                {possibleMasterScore
                  ? ` (${Math.round(possibleMasterScore * 100)}% match, no barcode yet)`
                  : ' (no barcode yet)'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button className="py-2 text-xs" onClick={onAcceptNameMatch}>
              Use this match
            </Button>
            <Button variant="secondary" className="py-2 text-xs" onClick={onDeclineNameMatch}>
              Keep lookup data
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Primary product card — master-first presentation */}
      <Card className="overflow-hidden border-monster-border p-0">
        <div className="flex gap-4 p-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-monster-dark">
            {collectionPreview ? (
              <img
                src={collectionPreview}
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold leading-tight text-white">
                {data.name || 'Unknown product'}
              </p>
              {isMasterVerified ? (
                <VerificationBadge kind="master_verified" />
              ) : isLookupOnly ? (
                <VerificationBadge kind="lookup_only" />
              ) : null}
            </div>
            {data.flavor ? <p className="mt-0.5 text-sm text-monster-muted">{data.flavor}</p> : null}
            <p className="mt-2 font-mono text-xs text-monster-green">{data.barcode}</p>
            <p className="mt-2 text-xs text-monster-muted">
              {isMasterVerified
                ? 'Product data from CanTrove Master Database'
                : isLookupOnly
                  ? 'Product identified using external lookup. CanTrove Master Database does not yet contain a verified version.'
                  : 'Enter product details manually on the next step.'}
            </p>
            {masterPreview ? (
              <p className="mt-1 text-[10px] text-monster-green">Approved master reference available</p>
            ) : null}
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
          <MetaItem label="Collection image" value={IMAGE_SOURCE_LABELS[data.image_source]} />
        </div>
      </Card>

      {/* Barcode Lookup Service — secondary, only when consulted */}
      {showLookupSection ? (
        <Card
          className={`p-4 ${
            lookup.tone === 'success'
              ? 'border-monster-border bg-monster-card'
              : lookup.tone === 'warning'
                ? 'border-yellow-600/30 bg-yellow-900/10'
                : 'border-monster-border bg-monster-card'
          }`}
        >
          <div className="flex items-start gap-3">
            {lookup.tone === 'success' ? (
              <Search size={18} className="mt-0.5 shrink-0 text-monster-muted" />
            ) : lookup.tone === 'warning' ? (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-400" />
            ) : (
              <Search size={18} className="mt-0.5 shrink-0 text-monster-muted" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">Barcode Lookup Service</p>
                {isLookupOnly && offStatus === 'found' ? (
                  <VerificationBadge kind="lookup_only" />
                ) : null}
              </div>
              <p className="text-[10px] uppercase tracking-wide text-monster-muted">
                Product identification only
              </p>
              <p className="mt-1 text-xs text-monster-muted">{lookup.detail}</p>
              {isLookupOnly && offStatus === 'found' ? (
                <p className="mt-2 text-xs text-yellow-100/80">
                  Product identified using external lookup. CanTrove Master Database does not yet
                  contain a verified version.
                </p>
              ) : null}
            </div>
          </div>

          {showOffPreview ? (
            <div className="mt-3 flex gap-3 rounded-xl border border-yellow-600/20 bg-black/20 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-monster-dark">
                <img
                  src={offPreview!}
                  alt="Barcode lookup preview"
                  className="h-full w-full object-contain p-1"
                />
                <span className="absolute bottom-0.5 left-0.5 rounded bg-black/75 px-1 py-0.5 text-[8px] text-yellow-300">
                  Lookup
                </span>
              </div>
              <p className="text-xs text-monster-muted">
                Reference image from external lookup — may be inaccurate. Upload your own can photo
                for the best collection quality.
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}

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
