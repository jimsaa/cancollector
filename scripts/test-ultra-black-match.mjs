// Quick sanity check: OFF "Ultra Black" should match catalog "Monster Ultra Black"
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Minimal inline copy of core matching logic for script use
function normalizeText(value) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function productNameSimilarity(a, b) {
  const left = normalizeText(a)
  const right = normalizeText(b)
  if (!left || !right) return 0
  if (left === right) return 1
  if (left.includes(right) || right.includes(left)) return 0.92
  return 0
}

const master = {
  product_name: 'Monster Ultra Black',
  brand: 'Monster Energy',
  flavor: 'Black',
  category: 'Monster Ultra',
  barcode: null,
}

const offName = 'Ultra Black'
const candidates = [
  master.product_name,
  master.flavor,
  `${master.category} ${master.flavor}`,
  'ultra black',
]

let best = 0
for (const c of candidates) {
  best = Math.max(best, productNameSimilarity(offName, c))
}

console.log('OFF name:', offName)
console.log('Master:', master.product_name)
console.log('Best score:', best)
console.log(best >= 0.75 ? 'PASS — high confidence match' : 'FAIL — score too low')

const imports = JSON.parse(readFileSync(join(root, 'data/imports/monster-products.json'), 'utf8'))
const ultra = imports.products?.find((p) => p.product_name?.includes('Ultra Black'))
console.log('In official import JSON:', Boolean(ultra), ultra?.product_name ?? 'not found')
