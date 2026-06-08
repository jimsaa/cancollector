import type { MasterCan } from '../types/masterCan'
import { normalizeMasterBarcode } from './masterCanSupabase'

export interface ProductMatchInput {
  product_name?: string | null
  brand?: string | null
  flavor?: string | null
  category?: string | null
  variant_name?: string | null
}

export interface MasterCanProductMatch {
  master: MasterCan
  score: number
  reason: string
}

const MIN_MATCH_SCORE = 0.55

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenSet(value: string): Set<string> {
  return new Set(value.split(' ').filter((token) => token.length > 1))
}

/** Token overlap similarity (0–1). */
export function productNameSimilarity(a: string, b: string): number {
  const left = normalizeText(a)
  const right = normalizeText(b)
  if (!left || !right) return 0
  if (left === right) return 1
  if (left.includes(right) || right.includes(left)) return 0.92

  const leftTokens = tokenSet(left)
  const rightTokens = tokenSet(right)
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0

  let overlap = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap++
  }

  const union = new Set([...leftTokens, ...rightTokens]).size
  return overlap / union
}

export function isBarcodelessMaster(master: MasterCan): boolean {
  return !normalizeMasterBarcode(master.barcode)
}

function flavorCategoryBonus(
  master: MasterCan,
  input: ProductMatchInput,
): { bonus: number; reason: string | null } {
  const flavor = normalizeText(input.flavor ?? input.variant_name)
  const category = normalizeText(input.category)
  const masterFlavor = normalizeText(master.flavor ?? master.variant_name)
  const masterCategory = normalizeText(master.category)

  if (flavor && masterFlavor && (masterFlavor.includes(flavor) || flavor.includes(masterFlavor))) {
    return { bonus: 0.12, reason: 'flavor match' }
  }
  if (category && masterCategory && masterCategory === category) {
    return { bonus: 0.08, reason: 'category match' }
  }
  return { bonus: 0, reason: null }
}

function brandBonus(master: MasterCan, input: ProductMatchInput): number {
  const brand = normalizeText(input.brand)
  const masterBrand = normalizeText(master.brand)
  if (!brand || !masterBrand) return 0
  if (brand === masterBrand) return 0.1
  if (masterBrand.includes(brand) || brand.includes(masterBrand)) return 0.06
  return 0
}

export function scoreMasterProductMatch(
  master: MasterCan,
  input: ProductMatchInput,
): MasterCanProductMatch | null {
  const productName = input.product_name?.trim()
  if (!productName) return null

  const nameScore = productNameSimilarity(productName, master.product_name)
  if (nameScore < 0.4) return null

  const { bonus: flavorBonus, reason: flavorReason } = flavorCategoryBonus(master, input)
  const score = Math.min(1, nameScore + brandBonus(master, input) + flavorBonus)
  if (score < MIN_MATCH_SCORE) return null

  const parts = [`${Math.round(nameScore * 100)}% name`]
  if (flavorReason) parts.push(flavorReason)

  return {
    master,
    score,
    reason: parts.join(', '),
  }
}

export function findBarcodelessMasterMatches(
  masters: MasterCan[],
  input: ProductMatchInput,
  options?: { limit?: number; minScore?: number },
): MasterCanProductMatch[] {
  const limit = options?.limit ?? 3
  const minScore = options?.minScore ?? MIN_MATCH_SCORE

  return masters
    .filter(isBarcodelessMaster)
    .map((master) => scoreMasterProductMatch(master, input))
    .filter((match): match is MasterCanProductMatch => Boolean(match && match.score >= minScore))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function findBestBarcodelessMasterMatch(
  masters: MasterCan[],
  input: ProductMatchInput,
): MasterCanProductMatch | null {
  return findBarcodelessMasterMatches(masters, input, { limit: 1 })[0] ?? null
}

export function pickMasterByProductIdentity(
  candidates: MasterCan[],
  input: ProductMatchInput,
): MasterCan | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const flavor = normalizeText(input.flavor ?? input.variant_name)
  const category = normalizeText(input.category)

  if (flavor) {
    const byFlavor = candidates.find((row) => {
      const rowFlavor = normalizeText(row.flavor ?? row.variant_name)
      return rowFlavor && (rowFlavor.includes(flavor) || flavor.includes(rowFlavor))
    })
    if (byFlavor) return byFlavor
  }

  if (category) {
    const byCategory = candidates.find((row) => normalizeText(row.category) === category)
    if (byCategory) return byCategory
  }

  return candidates[0]
}
