import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { CanFormData } from './CanForm'
import {
  getCollectionDisplayImageUrl,
  getReferenceImageUrl,
  getUserCanImageUrl,
  PLACEHOLDER_CAN_IMAGE,
} from '../../lib/canImage'
import { MASTER_IMAGE_SOURCE_LABELS } from '../../types/masterImageSource'
import type { MasterImageSource } from '../../types/masterImageSource'
import { CanImageUpload } from './CanImageUpload'

interface CanDetailImageTabsProps {
  data: CanFormData
  onChange: (data: CanFormData) => void
  onImageFileSelect: (file: File) => void
  onImageRemove: () => void
  imageUploading?: boolean
  imageUploadError?: string | null
  imageSizeWarning?: string | null
  masterSourceUrl?: string | null
  masterImageSource?: MasterImageSource | null
}

export function CanDetailImageTabs({
  data,
  onChange,
  onImageFileSelect,
  onImageRemove,
  imageUploading,
  imageUploadError,
  imageSizeWarning,
  masterSourceUrl,
  masterImageSource,
}: CanDetailImageTabsProps) {
  const [tab, setTab] = useState<'reference' | 'user'>('reference')

  const referenceUrl = getCollectionDisplayImageUrl({
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  })
  const hasReference = Boolean(getReferenceImageUrl({
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  }))
  const hasUserPhoto = Boolean(getUserCanImageUrl({ user_image_url: data.user_image_url }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-xl border border-monster-border bg-monster-dark p-1">
        <button
          type="button"
          onClick={() => setTab('reference')}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            tab === 'reference'
              ? 'bg-monster-green/20 text-monster-green'
              : 'text-monster-muted hover:text-white'
          }`}
        >
          Official Reference
        </button>
        <button
          type="button"
          onClick={() => setTab('user')}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            tab === 'user'
              ? 'bg-monster-green/20 text-monster-green'
              : 'text-monster-muted hover:text-white'
          }`}
        >
          My Can
        </button>
      </div>

      {tab === 'reference' ? (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-monster-dark">
            <img
              src={referenceUrl}
              alt="Official reference"
              className="h-full w-full object-contain p-4"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs text-monster-muted">
            {hasReference
              ? masterImageSource
                ? MASTER_IMAGE_SOURCE_LABELS[masterImageSource]
                : 'Catalog reference from the master database'
              : 'No reference image linked yet'}
          </p>
          {masterSourceUrl ? (
            <a
              href={masterSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-monster-green hover:underline"
            >
              View source page
              <ExternalLink size={12} />
            </a>
          ) : null}
          <p className="text-[10px] text-monster-muted">
            External reference only — not stored as your personal can photo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <CanImageUpload
            data={data}
            onChange={(patch) => onChange({ ...data, ...patch })}
            onFileSelect={onImageFileSelect}
            onRemove={onImageRemove}
            uploading={imageUploading}
            uploadError={imageUploadError}
            sizeWarning={imageSizeWarning}
            showSourceLabel={false}
            previewUrl={data.user_image_url?.trim() || PLACEHOLDER_CAN_IMAGE}
            userPhotoOnly
          />
          <p className="text-xs text-monster-muted">
            {hasUserPhoto
              ? 'Your photo is kept separately from the official reference image.'
              : 'Add your own can photo — the reference image stays available.'}
          </p>
        </div>
      )}
    </div>
  )
}
