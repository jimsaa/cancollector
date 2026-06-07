import type { CanInsert, Rarity, WishlistStatus } from '../../types/can'
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
  image_url: string
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
  image_url: '',
  opened: false,
  purchase_date: '',
  available_for_trade: false,
  notes: '',
  rarity: 'unknown',
  quantity: 1,
  is_wishlist: wishlist,
  wishlist_status: 'wanted',
})

export function formDataToInsert(data: CanFormData): CanInsert {
  return {
    barcode: data.barcode || null,
    name: data.name || null,
    brand: data.brand || null,
    flavor: data.flavor || null,
    volume: data.volume || null,
    country: data.country || null,
    country_variant: data.country_variant || null,
    image_url: data.image_url || null,
    opened: data.opened,
    purchase_date: data.purchase_date || null,
    available_for_trade: data.available_for_trade,
    notes: data.notes || null,
    rarity: data.rarity,
    quantity: data.quantity,
    is_wishlist: data.is_wishlist,
    wishlist_status: data.is_wishlist ? data.wishlist_status : null,
  }
}

interface CanFormFieldsProps {
  data: CanFormData
  onChange: (data: CanFormData) => void
  imagePreview?: string | null
  onImageUpload?: (file: File) => void
  uploading?: boolean
  showWishlistFields?: boolean
}

export function CanFormFields({
  data,
  onChange,
  imagePreview,
  onImageUpload,
  uploading,
  showWishlistFields,
}: CanFormFieldsProps) {
  const set = <K extends keyof CanFormData>(key: K, value: CanFormData[K]) => {
    onChange({ ...data, [key]: value })
  }

  const preview = imagePreview ?? data.image_url
  const wishlist = showWishlistFields ?? data.is_wishlist

  return (
    <div className="flex flex-col gap-4">
      {preview ? (
        <div className="mx-auto aspect-square w-40 overflow-hidden rounded-2xl border border-monster-border bg-monster-dark">
          <img src={preview} alt="Can preview" className="h-full w-full object-contain p-2" />
        </div>
      ) : null}

      {onImageUpload ? (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-monster-border p-4 transition-colors hover:border-monster-green">
          <span className="text-sm text-monster-muted">
            {uploading ? 'Uploading...' : 'Upload your own image'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImageUpload(file)
            }}
          />
        </label>
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
