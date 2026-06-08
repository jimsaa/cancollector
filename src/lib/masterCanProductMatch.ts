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
  matchedField: string
}

export type MatchConfidence = 'high' | 'medium' | 'low'

export const MATCH_CONFIDENCE_HIGH = 0.75
export const MATCH_CONFIDENCE_MEDIUM = 0.55
const MIN_MATCH_SCORE = MATCH_CONFIDENCE_MEDIUM

const BRAND_PREFIXES = [
  'monster energy',
  'monster',
  'red bull',
  'rockstar',
  'celsius',
  'nocco',
]

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

export function getMatchConfidence(score: number): MatchConfidence {
  if (score >= MATCH_CONFIDENCE_HIGH) return 'high'
  if (score >= MATCH_CONFIDENCE_MEDIUM) return 'medium'
  return 'low'
}

export function isBarcodelessMaster(master: MasterCan): boolean {
  return !normalizeMasterBarcode(master.barcode)
}

function stripBrandFromName(productName: string, brand?: string | null): string {
  let name = normalizeText(productName)
  const brandNorm = normalizeText(brand)
  if (brandNorm && name.startsWith(brandNorm)) {
    name = name.slice(brandNorm.length).trim()
  }
  for (const prefix of BRAND_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim()
      break
    }
  }
  return name
}

function getMasterSearchableNames(master: MasterCan): { value: string; field: string }[] {
  const entries: { value: string; field: string }[] = []
  const push = (value: string | null | undefined, field: string) => {
    const trimmed = value?.trim()
    if (trimmed) entries.push({ value: trimmed, field })
  }

  push(master.product_name, 'product_name')
  push(master.flavor, 'flavor')
  push(master.variant_name, 'variant_name')
  push(stripBrandFromName(master.product_name, master.brand), 'product_name_short')

  const seen = new Set<string>()
  return entries.filter((entry) => {
    const key = normalizeText(entry.value)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function allTokensContained(input: string, candidate: string): boolean {
  const inputTokens = tokenSet(normalizeText(input))
  const candidateNorm = normalizeText(candidate)
  if (inputTokens.size === 0) return false
  return [...inputTokens].every((token) => candidateNorm.includes(token))
}

function bestNameScoreForMaster(
  inputName: string,
  master: MasterCan,
): { score: number; field: string } {
  let best = { score: 0, field: 'product_name' }

  for (const candidate of getMasterSearchableNames(master)) {
    const score = productNameSimilarity(inputName, candidate.value)
    if (score > best.score) {
      best = { score, field: candidate.field }
    }
  }

  const fullName = normalizeText(master.product_name)
  const inputNorm = normalizeText(inputName)
  if (allTokensContained(inputName, master.product_name)) {
    best.score = Math.max(best.score, inputNorm.split(' ').length >= 2 ? 0.88 : 0.82)
    best.field = 'product_name'
  }
  if (fullName.endsWith(inputNorm) || fullName.includes(` ${inputNorm}`)) {
    best.score = Math.max(best.score, 0.9)
    best.field = 'product_name'
  }

  return best
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
    return { bonus: 0.1, reason: 'flavor match' }
  }
  if (category && masterCategory && masterCategory === category) {
    return { bonus: 0.06, reason: 'category match' }
  }
  return { bonus: 0, reason: null }
}

function brandBonus(master: MasterCan, input: ProductMatchInput): number {
  const brand = normalizeText(input.brand)
  const masterBrand = normalizeText(master.brand)
  if (!brand || !masterBrand) return 0
  if (brand === masterBrand) return 0.08
  if (masterBrand.includes(brand) || brand.includes(masterBrand)) return 0.05
  return 0
}

export function scoreMasterProductMatch(
  master: MasterCan,
  input: ProductMatchInput,
): MasterCanProductMatch | null {
  const productName = input.product_name?.trim()
  if (!productName) return null

  const { score: nameScore, field: matchedField } = bestNameScoreForMaster(productName, master)
  if (nameScore < 0.35) return null

  const { bonus: flavorBonus, reason: flavorReason } = flavorCategoryBonus(master, input)
  const score = Math.min(1, nameScore + brandBonus(master, input) + flavorBonus)
  if (score < MIN_MATCH_SCORE) return null

  const parts = [`${Math.round(nameScore * 100)}% ${matchedField}`]
  if (flavorReason) parts.push(flavorReason)

  return {
    master,
    score,
    reason: parts.join(', '),
    matchedField,
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
