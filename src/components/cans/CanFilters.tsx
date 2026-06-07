import type { CanFilters as Filters } from '../../types/can'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface CanFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  countries: string[]
}

export function CanFiltersBar({ filters, onChange, countries }: CanFiltersProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search name, barcode, flavor..."
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Select label="Status" value={filters.opened} onChange={(e) => set('opened', e.target.value as Filters['opened'])}>
          <option value="all">All</option>
          <option value="unopened">Unopened</option>
          <option value="opened">Opened</option>
        </Select>

        <Select label="Trade" value={filters.trade} onChange={(e) => set('trade', e.target.value as Filters['trade'])}>
          <option value="all">All</option>
          <option value="yes">For trade</option>
          <option value="no">Not for trade</option>
        </Select>

        <Select label="Rarity" value={filters.rarity} onChange={(e) => set('rarity', e.target.value as Filters['rarity'])}>
          <option value="all">All</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="unknown">Unknown</option>
        </Select>

        <Select label="Country" value={filters.country} onChange={(e) => set('country', e.target.value)}>
          <option value="all">All</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <Select label="Sort" value={filters.sort} onChange={(e) => set('sort', e.target.value as Filters['sort'])}>
        <option value="newest">Newest added</option>
        <option value="oldest">Oldest added</option>
        <option value="name">Name A–Z</option>
      </Select>
    </div>
  )
}
