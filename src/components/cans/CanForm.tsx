import type { CanInsert, Rarity } from '../../types/can'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export interface CanFormData {
  barcode: string
  name: string
  brand: string
  flavor: string
  volume: string
  country: string
  image_url: string
  opened: boolean
  purchase_date: string
  available_for_trade: boolean
  notes: string
  rarity: Rarity
  quantity: number
}

export const emptyFormData = (): CanFormData => ({
  barcode: '',
  name: '',
  brand: 'Monster',
  flavor: '',
  volume: '',
  country: '',
  image_url: '',
  opened: false,
  purchase_date: '',
  available_for_trade: false,
  notes: '',
  rarity: 'unknown',
  quantity: 1,
})

export function formDataToInsert(data: CanFormData): CanInsert {
  return {
    barcode: data.barcode || null,
    name: data.name || null,
    brand: data.brand || null,
    flavor: data.flavor || null,
    volume: data.volume || null,
    country: data.country || null,
    image_url: data.image_url || null,
    opened: data.opened,
    purchase_date: data.purchase_date || null,
    available_for_trade: data.available_for_trade,
    notes: data.notes || null,
    rarity: data.rarity,
    quantity: data.quantity,
  }
}

interface CanFormFieldsProps {
  data: CanFormData
  onChange: (data: CanFormData) => void
  imagePreview?: string | null
  onImageUpload?: (file: File) => void
  uploading?: boolean
}

export function CanFormFields({
  data,
  onChange,
  imagePreview,
  onImageUpload,
  uploading,
}: CanFormFieldsProps) {
  const set = <K extends keyof CanFormData>(key: K, value: CanFormData[K]) => {
    onChange({ ...data, [key]: value })
  }

  const preview = imagePreview ?? data.image_url

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

      <Input label="Barcode" value={data.barcode} onChange={(e) => set('barcode', e.target.value)} />
      <Input label="Name" value={data.name} onChange={(e) => set('name', e.target.value)} required />
      <Input label="Brand" value={data.brand} onChange={(e) => set('brand', e.target.value)} />
      <Input label="Flavor / Variant" value={data.flavor} onChange={(e) => set('flavor', e.target.value)} />
      <Input label="Volume" value={data.volume} onChange={(e) => set('volume', e.target.value)} placeholder="e.g. 500 ml" />
      <Input label="Country" value={data.country} onChange={(e) => set('country', e.target.value)} />

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

      <Input
        label="Notes"
        value={data.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Optional notes..."
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
    </div>
  )
}
