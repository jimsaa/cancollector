import type { Can, CanInsert, Rarity, WishlistStatus } from '../../types/can'
import type { CanTradeStatus, ConditionGrade, OpeningStatus, TradeCurrency } from '../../types/canCollector'
import type { ImageSource } from '../../types/imageSource'
import {
  applyOpeningStatusToInsert,
  applyTradeStatusToInsert,
  normalizeCanCollectorFields,
} from '../../lib/canCollectorFields'
import { getSaveImageFields, resolveScanDefaultImage } from '../../lib/canImage'
import { resolveWanted } from '../../lib/tradeFields'
import { CanCollectorFields } from './CanCollectorFields'
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
  opening_status: OpeningStatus
  purchase_date: string
  purchase_country: string
  purchase_city: string
  purchase_store: string
  available_for_trade: boolean
  trade_status: CanTradeStatus
  trade_price: string
  trade_currency: TradeCurrency | ''
  trade_note: string
  is_public: boolean
  show_on_public_profile: boolean
  condition_grade: ConditionGrade
  condition_notes: string
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
  image_source: 'default_placeholder',
  opened: false,
  opening_status: 'sealed',
  purchase_date: '',
  purchase_country: '',
  purchase_city: '',
  purchase_store: '',
  available_for_trade: false,
  trade_status: 'not_for_trade',
  trade_price: '',
  trade_currency: '',
  trade_note: '',
  is_public: false,
  show_on_public_profile: false,
  condition_grade: 'unknown',
  condition_notes: '',
  notes: '',
  rarity: 'unknown',
  quantity: 1,
  is_wishlist: wishlist,
  wishlist_status: 'wanted',
})

export function canToFormData(can: Can): CanFormData {
  const normalized = normalizeCanCollectorFields(can)
  return {
    barcode: normalized.barcode ?? '',
    name: normalized.name ?? '',
    brand: normalized.brand ?? 'Monster',
    flavor: normalized.flavor ?? '',
    volume: normalized.volume ?? '',
    country: normalized.country ?? '',
    country_variant: normalized.country_variant ?? '',
    user_image_url: normalized.user_image_url ?? '',
    master_image_url: normalized.master_image_url ?? '',
    off_image_url: normalized.off_image_url ?? '',
    image_source: normalized.image_source,
    opened: normalized.opened,
    opening_status: normalized.opening_status,
    purchase_date: normalized.purchase_date ?? '',
    purchase_country: normalized.purchase_country ?? '',
    purchase_city: normalized.purchase_city ?? '',
    purchase_store: normalized.purchase_store ?? '',
    available_for_trade: normalized.available_for_trade,
    trade_status: normalized.trade_status,
    trade_price: normalized.trade_price != null ? String(normalized.trade_price) : '',
    trade_currency: normalized.trade_currency ?? '',
    trade_note: normalized.trade_note ?? '',
    is_public: normalized.is_public,
    show_on_public_profile: normalized.show_on_public_profile,
    condition_grade: normalized.condition_grade,
    condition_notes: normalized.condition_notes ?? '',
    notes: normalized.notes ?? '',
    rarity: normalized.rarity,
    quantity: normalized.quantity,
    is_wishlist: normalized.is_wishlist,
    wishlist_status: normalized.wishlist_status ?? 'wanted',
  }
}

export function formDataToInsert(data: CanFormData): CanInsert {
  const imageFields = getSaveImageFields({
    image_source: data.image_source,
    user_image_url: data.user_image_url,
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
  })

  const tradePrice = data.trade_price.trim() ? Number(data.trade_price) : null

  return {
    barcode: data.barcode || null,
    name: data.name || null,
    brand: data.brand || null,
    flavor: data.flavor || null,
    volume: data.volume || null,
    country: data.country || null,
    country_variant: data.country_variant || null,
    ...imageFields,
    ...applyOpeningStatusToInsert(data.opening_status),
    purchase_date: data.purchase_date || null,
    purchase_country: data.purchase_country || null,
    purchase_city: data.purchase_city || null,
    purchase_store: data.purchase_store || null,
    ...applyTradeStatusToInsert(data.trade_status),
    trade_price: tradePrice != null && Number.isFinite(tradePrice) ? tradePrice : null,
    trade_currency: data.trade_currency || null,
    trade_note: data.trade_note || null,
    is_public: data.is_public,
    show_on_public_profile: data.show_on_public_profile,
    condition_grade: data.condition_grade,
    condition_notes: data.condition_notes || null,
    notes: data.notes || null,
    rarity: data.rarity,
    quantity: data.quantity,
    is_wishlist: data.is_wishlist,
    wishlist_status: data.is_wishlist ? data.wishlist_status : null,
    wanted: resolveWanted(data.is_wishlist, data.is_wishlist ? data.wishlist_status : null),
  }
}

/** After barcode scan — never defaults to Open Food Facts for collection image. */
export function applyScanImageToForm(
  data: CanFormData,
  options?: { masterReferenceApproved?: boolean },
): CanFormData {
  const resolved = resolveScanDefaultImage({
    user_image_url: data.user_image_url,
    master_image_url: data.master_image_url,
    off_image_url: data.off_image_url,
    master_reference_approved: options?.masterReferenceApproved,
  })
  return { ...data, image_source: resolved.image_source }
}

/** @deprecated Use applyScanImageToForm */
export function applyAutoImageToForm(data: CanFormData): CanFormData {
  return applyScanImageToForm(data)
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
          onRemove={onImageRemove ?? (() => onChange({ ...data, user_image_url: '', image_source: 'default_placeholder' }))}
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

          <CanCollectorFields data={data} onChange={onChange} />
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
