import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { CanFormData } from '../cans/CanForm'
import { CanImageUpload } from '../cans/CanImageUpload'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface AddCanStepEditProps {
  data: CanFormData
  onChange: (data: CanFormData) => void
  onBack: () => void
  onContinue: () => void
  onImageFileSelect: (file: File) => void
  onImageRemove: () => void
  imageUploading?: boolean
  imageUploadError?: string | null
  imageSizeWarning?: string | null
}

export function AddCanStepEdit({
  data,
  onChange,
  onBack,
  onContinue,
  onImageFileSelect,
  onImageRemove,
  imageUploading,
  imageUploadError,
  imageSizeWarning,
}: AddCanStepEditProps) {
  const set = <K extends keyof CanFormData>(key: K, value: CanFormData[K]) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-monster-muted">
        Review and adjust product details and choose your can image before saving.
      </p>

      <Card className="p-4">
        <CanImageUpload
          data={data}
          onChange={(patch) => onChange({ ...data, ...patch })}
          onFileSelect={onImageFileSelect}
          onRemove={onImageRemove}
          uploading={imageUploading}
          uploadError={imageUploadError}
          sizeWarning={imageSizeWarning}
          productImageButtonLabel="Use Product Image"
        />
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <Input label="Barcode" value={data.barcode} onChange={(e) => set('barcode', e.target.value)} />
        <Input
          label="Name"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
        <Input label="Brand" value={data.brand} onChange={(e) => set('brand', e.target.value)} />
        <Input
          label="Flavor / Variant"
          value={data.flavor}
          onChange={(e) => set('flavor', e.target.value)}
        />
        <Input
          label="Volume"
          value={data.volume}
          onChange={(e) => set('volume', e.target.value)}
          placeholder="e.g. 500 ml"
        />
        <Input
          label="Country"
          value={data.country}
          onChange={(e) => set('country', e.target.value)}
          placeholder="e.g. Sweden"
        />
        <Input
          label="Quantity"
          type="number"
          min={1}
          value={data.quantity}
          onChange={(e) => set('quantity', Math.max(1, parseInt(e.target.value) || 1))}
        />

        <label className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-dark px-4 py-3">
          <input
            type="checkbox"
            checked={data.opened}
            onChange={(e) => set('opened', e.target.checked)}
            className="h-4 w-4 accent-monster-green"
          />
          <span className="text-sm">Opened</span>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-monster-border bg-monster-dark px-4 py-3">
          <input
            type="checkbox"
            checked={data.available_for_trade}
            onChange={(e) => set('available_for_trade', e.target.checked)}
            className="h-4 w-4 accent-monster-green"
          />
          <span className="text-sm">Available for trade</span>
        </label>
      </Card>

      <Button fullWidth onClick={onContinue} className="py-4" disabled={!data.name.trim()}>
        <ArrowRight size={20} />
        Continue to Summary
      </Button>

      <Button variant="secondary" fullWidth onClick={onBack}>
        <ArrowLeft size={18} />
        Back to Match
      </Button>
    </div>
  )
}
