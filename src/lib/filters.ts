import type { CanFilters } from '../types/can'
import type { Can } from '../types/can'

export function filterAndSortCans(cans: Can[], filters: CanFilters): Can[] {
  let result = [...cans]

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.barcode?.includes(q) ||
        c.flavor?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q) ||
        c.brand?.toLowerCase().includes(q),
    )
  }

  if (filters.opened === 'opened') result = result.filter((c) => c.opened)
  if (filters.opened === 'unopened') result = result.filter((c) => !c.opened)

  if (filters.trade === 'yes') result = result.filter((c) => c.available_for_trade)
  if (filters.trade === 'no') result = result.filter((c) => !c.available_for_trade)

  if (filters.rarity !== 'all') result = result.filter((c) => c.rarity === filters.rarity)

  if (filters.country !== 'all') {
    result = result.filter((c) => c.country?.toLowerCase() === filters.country.toLowerCase())
  }

  switch (filters.sort) {
    case 'oldest':
      result.sort((a, b) => new Date(a.added_date).getTime() - new Date(b.added_date).getTime())
      break
    case 'name':
      result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
      break
    default:
      result.sort((a, b) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime())
  }

  return result
}

export function getUniqueCountries(cans: Can[]): string[] {
  const countries = new Set<string>()
  for (const can of cans) {
    if (can.country) countries.add(can.country)
  }
  return Array.from(countries).sort()
}

export const defaultFilters: CanFilters = {
  search: '',
  opened: 'all',
  trade: 'all',
  rarity: 'all',
  country: 'all',
  sort: 'newest',
}
