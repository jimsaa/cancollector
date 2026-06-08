import type { ApproveSuggestionInput } from '../../lib/pendingSuggestions'
import type { Rarity } from '../../types/can'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface AdminApproveFormFieldsProps {
  form: ApproveSuggestionInput
  onChange: (form: ApproveSuggestionInput) => void
  showSourceUrl?: boolean
  imageSourceNote?: string
}

export function AdminApproveFormFields({
  form,
  onChange,
  showSourceUrl = true,
  imageSourceNote,
}: AdminApproveFormFieldsProps) {
  return (
    <>
      <Input
        label="Product name"
        value={form.product_name}
        onChange={(e) => onChange({ ...form, product_name: e.target.value })}
        className="w-full"
      />
      <Input
        label="Brand"
        value={form.brand}
        onChange={(e) => onChange({ ...form, brand: e.target.value })}
        className="w-full"
      />
      <Input
        label="Category"
        value={form.category ?? ''}
        onChange={(e) => onChange({ ...form, category: e.target.value })}
        className="w-full"
      />
      <Input
        label="Flavor / variant"
        value={form.flavor ?? ''}
        onChange={(e) =>
          onChange({ ...form, flavor: e.target.value, variant_name: e.target.value })
        }
        className="w-full"
      />
      <Input
        label="Volume"
        value={form.volume ?? ''}
        onChange={(e) => onChange({ ...form, volume: e.target.value })}
        className="w-full"
      />
      <Input
        label="Country"
        value={form.country ?? ''}
        onChange={(e) => onChange({ ...form, country: e.target.value })}
        className="w-full"
      />
      <Select
        label="Rarity"
        value={form.rarity ?? 'unknown'}
        onChange={(e) => onChange({ ...form, rarity: e.target.value as Rarity })}
        className="w-full"
      >
        <option value="unknown">Unknown</option>
        <option value="common">Common</option>
        <option value="uncommon">Uncommon</option>
        <option value="rare">Rare</option>
      </Select>
      <Input
        label="Barcode (optional)"
        value={form.barcode ?? ''}
        onChange={(e) => onChange({ ...form, barcode: e.target.value })}
        placeholder="Add later if unknown"
        className="w-full"
      />
      <Input
        label="Reference image URL (external)"
        value={form.reference_image_url ?? form.image_url ?? ''}
        onChange={(e) =>
          onChange({ ...form, reference_image_url: e.target.value, image_url: e.target.value })
        }
        placeholder="https://..."
        className="w-full"
      />
      <Select
        label="Reference image source"
        value={form.image_source ?? 'official_site'}
        onChange={(e) =>
          onChange({
            ...form,
            image_source: e.target.value as ApproveSuggestionInput['image_source'],
          })
        }
        className="w-full"
      >
        <option value="official_site">Official site</option>
        <option value="manual">Manual</option>
        <option value="open_food_facts">Open Food Facts</option>
        <option value="seed">Seed</option>
        <option value="placeholder">Placeholder</option>
      </Select>
      {imageSourceNote ? (
        <p className="-mt-1 text-[10px] text-monster-muted">{imageSourceNote}</p>
      ) : null}
      {showSourceUrl ? (
        <Input
          label="Source URL"
          value={form.source_url ?? ''}
          onChange={(e) => onChange({ ...form, source_url: e.target.value })}
          className="w-full"
        />
      ) : null}
      <label className="flex w-full items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={form.discontinued ?? false}
          onChange={(e) => onChange({ ...form, discontinued: e.target.checked })}
          className="accent-monster-green"
        />
        Discontinued
      </label>
    </>
  )
}
