import { BRAND_FILTER_LABELS, ENERGY_BRANDS, type MasterBrandFilter } from '../../types/masterCan'

interface BrandFilterProps {
  value: MasterBrandFilter
  onChange: (brand: MasterBrandFilter) => void
}

export function BrandFilter({ value, onChange }: BrandFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
          value === 'all'
            ? 'border-monster-green bg-monster-green/20 text-monster-green'
            : 'border-monster-border text-monster-muted hover:text-white'
        }`}
      >
        All
      </button>
      {ENERGY_BRANDS.map((brand) => (
        <button
          key={brand}
          type="button"
          onClick={() => onChange(brand)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
            value === brand
              ? 'border-monster-green bg-monster-green/20 text-monster-green'
              : 'border-monster-border text-monster-muted hover:text-white'
          }`}
        >
          {BRAND_FILTER_LABELS[brand]}
        </button>
      ))}
    </div>
  )
}
