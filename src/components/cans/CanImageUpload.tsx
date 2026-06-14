import { ImagePlus, Trash2, AlertTriangle, Camera, ImageIcon, Download } from 'lucide-react'

import {

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

  /** Wizard flow with explicit image quality choices. */

  wizardMode?: boolean

  /** Override preview image (e.g. user photo only on detail tab). */

  previewUrl?: string | null

  /** Hide source toggles — upload/remove user photo only. */

  userPhotoOnly?: boolean

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

  wizardMode = false,

  previewUrl,

  userPhotoOnly = false,

}: CanImageUploadProps) {

  const preview = previewUrl ?? getDisplayImageUrl(data)

  const hasUserPhoto = Boolean(data.user_image_url?.trim())

  const hasOffImage = Boolean(data.off_image_url?.trim())

  const usingUserPhoto = data.image_source === 'user_uploaded' && hasUserPhoto

  const usingOff = data.image_source === 'open_food_facts_unverified'

  const usingPlaceholder = data.image_source === 'default_placeholder'

  const usingMaster = data.image_source === 'master_reference'



  const setSource = (source: ImageSource) => onChange({ image_source: source })



  return (

    <div className="flex flex-col gap-3">

      <div className="flex items-center justify-between gap-2">

        <p className="text-xs font-semibold uppercase tracking-wide text-monster-muted">

          {userPhotoOnly ? 'My Can Photo' : 'Collection Image'}

        </p>

        {showSourceLabel || wizardMode ? (

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

                : usingOff

                  ? 'bg-yellow-600/90 text-black'

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



      {wizardMode && usingOff ? (

        <p className="flex items-start gap-2 rounded-xl border border-yellow-600/30 bg-yellow-900/20 p-3 text-xs text-yellow-200">

          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-400" />

          Open Food Facts images are often low quality or inaccurate. Upload your own can photo for

          the best collection quality.

        </p>

      ) : null}



      {wizardMode ? (

        <div className="flex flex-col gap-2">

          <label>

            <span className="sr-only">Upload my can photo</span>

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

              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${

                usingUserPhoto

                  ? 'border-monster-green bg-monster-green/20 text-monster-green'

                  : 'border-monster-border bg-monster-card text-white hover:border-monster-green'

              } ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}`}

            >

              <Camera size={18} />

              {uploading ? 'Processing...' : 'Upload My Can Photo'}

            </span>

          </label>



          <Button

            type="button"

            variant={usingPlaceholder || usingMaster ? 'primary' : 'secondary'}

            className="py-3"

            disabled={disabled || uploading}

            onClick={() => setSource(data.master_image_url?.trim() ? 'master_reference' : 'default_placeholder')}

          >

            <ImageIcon size={18} />

            Use Default Can Image

          </Button>



          <Button

            type="button"

            variant={usingOff ? 'primary' : 'secondary'}

            className="py-3"

            disabled={disabled || uploading || !hasOffImage}

            onClick={() => setSource('open_food_facts_unverified')}

          >

            <Download size={18} />

            Use Open Food Facts Image Anyway

          </Button>



          {hasUserPhoto && usingUserPhoto ? (

            <Button

              type="button"

              variant="secondary"

              className="py-3"

              disabled={disabled || uploading}

              onClick={onRemove}

            >

              <Trash2 size={18} />

              Remove My Photo

            </Button>

          ) : null}

        </div>

      ) : (

        <>

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



          {!userPhotoOnly ? (

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

              <Button

                type="button"

                variant={usingUserPhoto ? 'primary' : 'secondary'}

                className="py-3"

                disabled={disabled || uploading || !hasUserPhoto}

                onClick={() => setSource('user_uploaded')}

              >

                <Camera size={18} />

                Use My Photo

              </Button>

              <Button

                type="button"

                variant={usingPlaceholder || usingMaster ? 'primary' : 'secondary'}

                className="py-3"

                disabled={disabled || uploading}

                onClick={() =>

                  setSource(data.master_image_url?.trim() ? 'master_reference' : 'default_placeholder')

                }

              >

                <ImageIcon size={18} />

                Use Default Can Image

              </Button>

            </div>

          ) : null}

        </>

      )}



      {wizardMode ? (

        <p className="text-xs text-monster-muted">

          Collection images use your photo, an admin-approved master reference, or a clean generic

          placeholder. Open Food Facts is only used when you choose it explicitly.

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


