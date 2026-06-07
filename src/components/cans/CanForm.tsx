import type { Can, CanInsert, Rarity, WishlistStatus } from '../../types/can'
import type { ImageSource } from '../../types/imageSource'
import { getSaveImageFields, resolveAutoImage } from '../../lib/canImage'
import { resolveWanted } from '../../lib/tradeFields'
import { CanImageUpload } from './CanImageUpload'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export interface CanFormData {
  barcode: string
  name: string
  brand: string
  flavor: string
  volume: string
  country: string
  country_variant: string
  user_image_url: string
  master_image_url: string
  off_image_url: string
  image_source: ImageSource
  opened: boolean
  purchase_date: string
  available_for_trade: boolean
  notes: string
  rarity: Rarity
  quantity: number
  is_wishlist: boolean
  wishlist_status: WishlistStatus
}

export const emptyFormData = (wishlist = false): CanFormData => ({
  barcode: '',
  name: '',
  brand: 'Monster',
  flavor: '',
  volume: '',
  country: '',
  country_variant: '',
  user_image_url: '',
  master_image_url: '',
  off_image_url: '',
  image_source: 'placeholder',
  opened: false,
  purchase_date: '',
  available_for_trade: false,
  notes: '',
  rarity: 'unknown',
  quantity: 1,
  is_wishlist: wishlist,
  wishlist_status: 'wanted',
})

export function canToFormData(can: Can): CanFormData {
  return {
    barcode: can.barcode ?? '',
    name: can.name ?? '',
    brand: can.brand ?? 'Monster',
    flavor: can.flavor ?? '',
    volume: can.volume ?? '',
    country: can.country ?? '',
    country_variant: can.country_variant ?? '',
    user_image_url: can.user_image_url ?? '',
    master_image_url: can.master_image_url ?? '',
    off_image_url: can.off_image_url ?? '',
    image_source: can.image_source,
    opened: can.opened,
    purchase_date: can.purchase_date ?? '',
    available_for_trade: can.available_for_trade,
    notes: can.notes ?? '',
    rarity: can.rarity,
    quantity: can.quantity,
    is_wishlist: can.is_wishlist,
    wishlist_status: can.wishlist_status ?? 'wanted',
  }
}

export function formDataToInsert(data: CanFormData): CanInsert {
  const imageFields = getSaveImageFields({
    image_source: data.image_source,
    user_image_url: data.user_image_url,
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  })

  return {
    barcode: data.barcode || null,
    name: data.name || null,
    brand: data.brand || null,
    flavor: data.flavor || null,
    volume: data.volume || null,
    country: data.country || null,
    country_variant: data.country_variant || null,
    ...imageFields,
    opened: data.opened,
    purchase_date: data.purchase_date || null,
    available_for_trade: data.available_for_trade,
    notes: data.notes || null,
    rarity: data.rarity,
    quantity: data.quantity,
    is_wishlist: data.is_wishlist,
    wishlist_status: data.is_wishlist ? data.wishlist_status : null,
    wanted: resolveWanted(data.is_wishlist, data.is_wishlist ? data.wishlist_status : null),
  }
}

export function applyAutoImageToForm(data: CanFormData): CanFormData {
  const resolved = resolveAutoImage({
    user_image_url: data.user_image_url,
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  })
  return { ...data, image_source: resolved.image_source }
}

interface CanFormFieldsProps {
  data: CanFormData
  onChange: (data: CanFormData) => void
  onImageFileSelect?: (file: File) => void
  onImageRemove?: () => void
  imageUploading?: boolean
  imageUploadError?: string | null
  imageSizeWarning?: string | null
  showWishlistFields?: boolean
  showImageSource?: boolean
  hideImageUpload?: boolean
}

export function CanFormFields({
  data,
  onChange,
  onImageFileSelect,
  onImageRemove,
  imageUploading,
  imageUploadError,
  imageSizeWarning,
  showWishlistFields,
  showImageSource,
  hideImageUpload,
}: CanFormFieldsProps) {
  const set = <K extends keyof CanFormData>(key: K, value: CanFormData[K]) => {
    onChange({ ...data, [key]: value })
  }

  const wishlist = showWishlistFields ?? data.is_wishlist

  return (
    <div className="flex flex-col gap-4">
      {onImageFileSelect && !hideImageUpload ? (
        <CanImageUpload
          data={data}
          onChange={(patch) => onChange({ ...data, ...patch })}
          onFileSelect={onImageFileSelect}
          onRemove={onImageRemove ?? (() => onChange({ ...data, user_image_url: '', image_source: 'placeholder' }))}
          uploading={imageUploading}
          uploadError={imageUploadError}
          sizeWarning={imageSizeWarning}
          showSourceLabel={showImageSource}
        />
      ) : null}

      {wishlist ? (
        <div className="flex gap-2">
          {(['wanted', 'missing'] as WishlistStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => set('wishlist_status', status)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                data.wishlist_status === status
                  ? 'border-monster-green bg-monster-green/20 text-monster-green'
                  : 'border-monster-border bg-monster-dark text-monster-muted'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      ) : null}

      <Input label="Barcode" value={data.barcode} onChange={(e) => set('barcode', e.target.value)} />
      <Input label="Name" value={data.name} onChange={(e) => set('name', e.target.value)} required />
      <Input label="Brand" value={data.brand} onChange={(e) => set('brand', e.target.value)} />
      <Input label="Flavor / Variant" value={data.flavor} onChange={(e) => set('flavor', e.target.value)} />
      <Input label="Volume" value={data.volume} onChange={(e) => set('volume', e.target.value)} placeholder="e.g. 500 ml" />
      <Input label="Country" value={data.country} onChange={(e) => set('country', e.target.value)} placeholder="e.g. Sweden" />
      <Input
        label="Country Variant"
        value={data.country_variant}
        onChange={(e) => set('country_variant', e.target.value)}
        placeholder="e.g. UK import, limited edition"
      />

      {!wishlist ? (
        <>
          <Select label="Rarity" value={data.rarity} onChange={(e) => set('rarity', e.target.value as Rarity)}>
            <option value="unknown">Unknown</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
          </Select>

          <Input
            label="Quantity"
            type="number"
            min={1}
            value={data.quantity}
            onChange={(e) => set('quantity', Math.max(1, parseInt(e.target.value) || 1))}
          />

          <Input
            label="Purchase Date"
            type="date"
            value={data.purchase_date}
            onChange={(e) => set('purchase_date', e.target.value)}
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
        </>
      ) : null}

      <Input
        label="Notes"
        value={data.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Optional notes..."
      />
    </div>
  )
}
