import { ImagePlus, Trash2, AlertTriangle, Camera, ImageIcon } from 'lucide-react'
import {
  getDefaultProductSource,
  getDisplayImageUrl,
  IMAGE_SOURCE_LABELS,
} from '../../lib/canImage'
import type { ImageSource } from '../../types/imageSource'
import type { CanFormData } from './CanForm'
import { Button } from '../ui/Button'

interface CanImageUploadProps {
  data: Pick<
    CanFormData,
    'user_image_url' | 'master_image_url' | 'off_image_url' | 'image_source'
  >
  onChange: (
    patch: Partial<
      Pick<CanFormData, 'user_image_url' | 'master_image_url' | 'off_image_url' | 'image_source'>
    >,
  ) => void
  onFileSelect: (file: File) => void
  onRemove: () => void
  uploading?: boolean
  uploadError?: string | null
  sizeWarning?: string | null
  disabled?: boolean
  showSourceLabel?: boolean
  productImageButtonLabel?: string
}

export function CanImageUpload({
  data,
  onChange,
  onFileSelect,
  onRemove,
  uploading,
  uploadError,
  sizeWarning,
  disabled,
  showSourceLabel = false,
  productImageButtonLabel = 'Use Default Product Image',
}: CanImageUploadProps) {
  const preview = getDisplayImageUrl(data)
  const hasUserPhoto = Boolean(data.user_image_url?.trim())
  const defaultSource = getDefaultProductSource({
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  })
  const usingUserPhoto = data.image_source === 'user' && hasUserPhoto
  const usingDefault = data.image_source !== 'user' || !hasUserPhoto

  const setSource = (source: ImageSource) => onChange({ image_source: source })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">Can Image</p>
        {showSourceLabel ? (
          <span className="rounded bg-monster-dark px-2 py-0.5 text-[10px] text-monster-muted">
            Source: {IMAGE_SOURCE_LABELS[data.image_source]}
          </span>
        ) : null}
      </div>

      {preview ? (
        <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-monster-border bg-monster-dark">
          <img src={preview} alt="Can preview" className="h-full w-full object-contain p-3" />
          <span
            className={`absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold ${
              usingUserPhoto
                ? 'bg-monster-green/90 text-black'
                : 'bg-black/70 text-monster-muted'
            }`}
          >
            {IMAGE_SOURCE_LABELS[data.image_source]}
          </span>
        </div>
      ) : (
        <div className="mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-dashed border-monster-border bg-monster-dark">
          <ImagePlus size={40} className="text-monster-muted/40" />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Upload image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileSelect(file)
              e.target.value = ''
            }}
          />
          <span
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-monster-border bg-monster-card px-4 py-3 text-sm font-medium text-white transition-colors hover:border-monster-green ${
              disabled || uploading ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <ImagePlus size={18} className="text-monster-green" />
            {uploading ? 'Processing...' : 'Upload image'}
          </span>
        </label>

        {hasUserPhoto && usingUserPhoto ? (
          <Button
            type="button"
            variant="secondary"
            className="flex-1 py-3"
            disabled={disabled || uploading}
            onClick={onRemove}
          >
            <Trash2 size={18} />
            Remove photo
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant={usingUserPhoto ? 'primary' : 'secondary'}
          className="py-3"
          disabled={disabled || uploading || !hasUserPhoto}
          onClick={() => setSource('user')}
        >
          <Camera size={18} />
          Use My Photo
        </Button>
        <Button
          type="button"
          variant={usingDefault ? 'primary' : 'secondary'}
          className="py-3"
          disabled={disabled || uploading}
          onClick={() => setSource(defaultSource)}
        >
          <ImageIcon size={18} />
          {productImageButtonLabel}
        </Button>
      </div>

      {showSourceLabel ? (
        <p className="text-xs text-monster-muted">
          Default product image uses master database, then Open Food Facts front photo, then a
          generic placeholder.
        </p>
      ) : null}

      {sizeWarning ? (
        <p className="flex items-start gap-2 text-xs text-yellow-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {sizeWarning}
        </p>
      ) : null}

      {uploadError ? (
        <p className="flex items-start gap-2 text-sm text-red-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {uploadError}
        </p>
      ) : null}
    </div>
  )
}
